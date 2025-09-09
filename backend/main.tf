terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    postgresql = {
      source  = "cyrilgdn/postgresql"
      version = "~> 1.21"
    }
  }

  backend "s3" {
    bucket = "ground-sense-terraform-state"
    key    = "backend/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "ground-sense-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  enable_vpn_gateway = false

  tags = {
    Terraform   = "true"
    Environment = var.environment
    Project     = "ground-sense-bot"
  }
}

# Security Groups
resource "aws_security_group" "app" {
  name_prefix = "ground-sense-app-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Application port"
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "ground-sense-app-sg"
    Environment = var.environment
  }
}

resource "aws_security_group" "database" {
  name_prefix = "ground-sense-db-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "PostgreSQL access from application"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "ground-sense-db-sg"
    Environment = var.environment
  }
}

# RDS PostgreSQL
resource "aws_db_subnet_group" "main" {
  name       = "ground-sense-db-subnet"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Name        = "ground-sense-db-subnet"
    Environment = var.environment
  }
}

resource "aws_db_instance" "main" {
  identifier = "ground-sense-${var.environment}"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"

  db_name  = "ground_sense_bot"
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  multi_az               = var.environment == "prod"
  publicly_accessible    = false
  skip_final_snapshot    = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "ground-sense-final-snapshot" : null

  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn         = aws_iam_role.rds_enhanced_monitoring.arn

  tags = {
    Name        = "ground-sense-database"
    Environment = var.environment
  }
}

# S3 Bucket for file storage
resource "aws_s3_bucket" "uploads" {
  bucket = "ground-sense-uploads-${var.environment}-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "ground-sense-uploads"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ECS Cluster and Service
resource "aws_ecs_cluster" "main" {
  name = "ground-sense-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "ground-sense-cluster"
    Environment = var.environment
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = "ground-sense-app-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.app_cpu
  memory                   = var.app_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "ground-sense-app"
      image = "${aws_ecr_repository.app.repository_url}:latest"

      environment = [
        {
          name  = "SERVER_HOST"
          value = "0.0.0.0"
        },
        {
          name  = "SERVER_PORT"
          value = "8080"
        },
        {
          name  = "DB_HOST"
          value = aws_db_instance.main.address
        },
        {
          name  = "DB_PORT"
          value = "5432"
        },
        {
          name  = "DB_USER"
          value = var.db_username
        },
        {
          name  = "DB_PASSWORD"
          value = var.db_password
        },
        {
          name  = "DB_NAME"
          value = aws_db_instance.main.db_name
        },
        {
          name  = "STORAGE_BUCKET"
          value = aws_s3_bucket.uploads.bucket
        },
        {
          name  = "JWT_SECRET"
          value = var.jwt_secret
        }
      ]

      portMappings = [
        {
          containerPort = 8080
          hostPort      = 8080
          protocol      = "tcp"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/health"]
        interval = 30
        timeout  = 5
        retries  = 3
      }
    }
  ])

  tags = {
    Name        = "ground-sense-app-task"
    Environment = var.environment
  }
}

resource "aws_ecs_service" "app" {
  name            = "ground-sense-app-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.app_desired_count

  network_configuration {
    security_groups  = [aws_security_group.app.id]
    subnets          = module.vpc.private_subnets
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "ground-sense-app"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.app]

  tags = {
    Name        = "ground-sense-app-service"
    Environment = var.environment
  }
}

# Application Load Balancer
resource "aws_lb" "app" {
  name               = "ground-sense-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.app.id]
  subnets            = module.vpc.public_subnets

  enable_deletion_protection = var.environment == "prod"

  tags = {
    Name        = "ground-sense-alb"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "app" {
  name        = "ground-sense-${var.environment}"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/api/v1/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name        = "ground-sense-target-group"
    Environment = var.environment
  }
}

resource "aws_lb_listener" "app" {
  load_balancer_arn = aws_lb.app.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# CloudWatch Logs
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/ground-sense-${var.environment}"
  retention_in_days = 30

  tags = {
    Name        = "ground-sense-logs"
    Environment = var.environment
  }
}

# IAM Roles
resource "aws_iam_role" "ecs_execution" {
  name = "ground-sense-ecs-execution-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "ground-sense-ecs-execution-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name = "ground-sense-ecs-task-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "ground-sense-ecs-task-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "ecs_task" {
  name = "ground-sense-ecs-task-policy-${var.environment}"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.uploads.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.uploads.arn
      }
    ]
  })
}

resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "ground-sense-rds-monitoring-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "ground-sense-rds-monitoring-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ECR Repository
resource "aws_ecr_repository" "app" {
  name = "ground-sense-app"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "ground-sense-ecr"
    Environment = var.environment
  }
}

# Random suffix for S3 bucket
resource "random_string" "bucket_suffix" {
  length  = 8
  lower   = true
  upper   = false
  numeric = true
  special = false
}

# Outputs
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.app.dns_name
}

output "database_endpoint" {
  description = "Database endpoint"
  value       = aws_db_instance.main.address
}

output "s3_bucket_name" {
  description = "S3 bucket for uploads"
  value       = aws_s3_bucket.uploads.bucket
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.app.repository_url
}

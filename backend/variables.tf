variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "ground_sense_user"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "app_cpu" {
  description = "ECS task CPU units"
  type        = string
  default     = "256"
}

variable "app_memory" {
  description = "ECS task memory"
  type        = string
  default     = "512"
}

variable "app_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 1
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

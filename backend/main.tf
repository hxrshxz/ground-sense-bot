// Create a new file named `variables.tf`
// and add the following content:

variable "db_username" {
  description = "The username for the database."
  type        = string
  default     = "user"
}

variable "db_password" {
  description = "The password for the database."
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "The name of the database."
  type        = string
  default     = "chat"
}

// Create a new file named `main.tf`
// and add the following content:

provider "docker" {}

resource "docker_image" "postgres" {
  name = "postgres:13-alpine"
}

resource "docker_container" "db" {
  image = docker_image.postgres.latest
  name  = "db"
  ports {
    internal = 5432
    external = 5432
  }
  env = [
    "POSTGRES_USER=${var.db_username}",
    "POSTGRES_PASSWORD=${var.db_password}",
    "POSTGRES_DB=${var.db_name}",
  ]
}

resource "docker_image" "app" {
  name = "app"
  build {
    context = "."
  }
}

resource "docker_container" "app" {
  image = docker_image.app.latest
  name  = "app"
  ports {
    internal = 8080
    external = 8080
  }
  depends_on = [docker_container.db]
  env = [
    "DATABASE_URL=postgres://${var.db_username}:${var.db_password}@db:5432/${var.db_name}?sslmode=disable",
  ]
}

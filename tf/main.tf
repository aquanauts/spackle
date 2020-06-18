terraform {
  backend "s3" {
    bucket = "tf.spackle.dev"
    key    = "terraform.tfstate"
    region = "us-east-1"
  }
}


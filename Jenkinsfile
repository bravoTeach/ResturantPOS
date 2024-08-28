pipeline {
    agent any

    environment {
        DB_HOST = "db"
        DB_DATABASE = "pos_db"
        DB_USERNAME = "pos_user"
        DB_PASSWORD = "pos_password"
    }

    stages {
        stage('Checkout Code') {
            steps {
                // Checkout code from the repository
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Build the Docker image using the Dockerfile
                    sh 'docker-compose build'
                }
            }
        }

        stage('Start Containers') {
            steps {
                script {
                    // Start the Docker containers
                    sh 'docker-compose up -d'
                }
            }
        }

        stage('Run Migrations') {
            steps {
                script {
                    // Run Laravel migrations to set up the database schema
                    sh 'docker-compose exec app php artisan migrate --force'
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    // Run Laravel tests
                    sh 'docker-compose exec app php artisan test'
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // Here you would normally push the Docker image to a registry or deploy it to a production environment.
                    // For now, this will just be a placeholder
                    echo 'Deploying application...'
                }
            }
        }
    }

    post {
        always {
            script {
                // Clean up after the build
                sh 'docker-compose down'
            }
        }
        success {
            echo 'Build, test, and deployment succeeded!'
        }
        failure {
            echo 'Build, test, or deployment failed.'
        }
    }
}

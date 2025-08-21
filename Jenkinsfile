pipeline {
  agent any
  environment {
    REGISTRY = credentials('dockerhub-creds')
    DOCKER_IMAGE_FE = "your-docker-id/stock-frontend"
    DOCKER_IMAGE_BE = "your-docker-id/stock-backend"
    IMAGE_TAG = "${env.BUILD_NUMBER}"
    KUBECONFIG_CRED = 'kubeconfig-cred-id'
    SONARQUBE_ENV = 'SonarQubeServer'
  }
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Node Install (FE/BE)') {
      steps {
        dir('frontend') { sh 'npm ci || npm install' }
        dir('backend') { sh 'npm ci || npm install' }
      }
    }
    stage('Lint') {
      steps {
        dir('frontend') { sh 'npm run lint' }
        dir('backend') { sh 'npm run lint' }
      }
    }
    stage('Unit Tests') { steps { dir('backend') { sh 'npm test || true' } } }
    stage('SonarQube Analysis') {
      environment { scannerHome = tool 'SonarQubeScanner' }
      steps { withSonarQubeEnv('SonarQubeServer') { sh '${scannerHome}/bin/sonar-scanner -Dsonar.projectBaseDir=.' } }
    }
    stage('Build Docker Images') {
      steps {
        sh 'docker build -t ${DOCKER_IMAGE_FE}:${IMAGE_TAG} -t ${DOCKER_IMAGE_FE}:latest ./frontend'
        sh 'docker build -t ${DOCKER_IMAGE_BE}:${IMAGE_TAG} -t ${DOCKER_IMAGE_BE}:latest ./backend'
      }
    }
    stage('Trivy Scan') {
      steps {
        sh 'trivy image --exit-code 0 --format table -o trivy-report/frontend-${BUILD_NUMBER}.txt ${DOCKER_IMAGE_FE}:${IMAGE_TAG}'
        sh 'trivy image --exit-code 0 --format table -o trivy-report/backend-${BUILD_NUMBER}.txt ${DOCKER_IMAGE_BE}:${IMAGE_TAG}'
        archiveArtifacts artifacts: 'trivy-report/*.txt', fingerprint: true
      }
    }
    stage('Push Images') {
      steps {
        sh 'echo "$REGISTRY_PSW" | docker login -u "$REGISTRY_USR" --password-stdin'
        sh 'docker push ${DOCKER_IMAGE_FE}:${IMAGE_TAG}'
        sh 'docker push ${DOCKER_IMAGE_FE}:latest'
        sh 'docker push ${DOCKER_IMAGE_BE}:${IMAGE_TAG}'
        sh 'docker push ${DOCKER_IMAGE_BE}:latest'
      }
    }
    stage('Deploy to Kubernetes') {
      steps {
        withCredentials([file(credentialsId: "${KUBECONFIG_CRED}", variable: 'KUBECONFIG_FILE')]) {
          sh 'export KUBECONFIG=$KUBECONFIG_FILE && kubectl apply -f k8s/namespace.yaml'
          sh 'export KUBECONFIG=$KUBECONFIG_FILE && kubectl -n devops-stocks set image deployment/backend backend=${DOCKER_IMAGE_BE}:${IMAGE_TAG} --record || true'
          sh 'export KUBECONFIG=$KUBECONFIG_FILE && kubectl -n devops-stocks set image deployment/frontend frontend=${DOCKER_IMAGE_FE}:${IMAGE_TAG} --record || true'
          sh 'export KUBECONFIG=$KUBECONFIG_FILE && kubectl apply -f k8s/secret-alpha-vantage.yaml'
          sh 'export KUBECONFIG=$KUBECONFIG_FILE && kubectl apply -f k8s/backend-deployment.yaml'
          sh 'export KUBECONFIG=$KUBECONFIG_FILE && kubectl apply -f k8s/frontend-deployment.yaml'
          sh 'export KUBECONFIG=$KUBECONFIG_FILE && kubectl apply -f k8s/ingress.yaml'
        }
      }
    }
  }
  post { always { archiveArtifacts artifacts: 'k8s/*.yaml', fingerprint: true } }
}

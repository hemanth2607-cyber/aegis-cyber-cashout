# Aegis-Cyber Cashout Forecaster // AWS Cloud Deployment Guide

**Smart India Hackathon (SIH 2024) | Problem Statement: `SIH26184`**  
**Standards:** Ministry of Home Affairs (MHA) / I4C / ERSS Dial 112 / Sec 106 BNSS Alignment  
**Target Region:** AWS Mumbai (`ap-south-1`)

---

## 1. Overview of AWS Deployment Assets

This repository includes a complete production deployment kit tailored for Amazon Web Services:

| File | Purpose |
|---|---|
| [`deploy/aws_cloudformation.yaml`](file:///c:/Users/heman/Desktop/Projects/pervekkala/deploy/aws_cloudformation.yaml) | **1-Click Infrastructure-as-Code**: Creates VPC, Subnets, Security Groups, EC2 instance, and auto-provisions Aegis via UserData. |
| [`deploy/setup_aws_ec2.sh`](file:///c:/Users/heman/Desktop/Projects/pervekkala/deploy/setup_aws_ec2.sh) | **Automated Ubuntu Bootstrap**: Installs Docker, Compose v2, Git, Nginx reverse proxy, and runs all containers. |
| [`deploy/nginx.conf`](file:///c:/Users/heman/Desktop/Projects/pervekkala/deploy/nginx.conf) | **Unified Port 80 Proxy**: Routes `/` to Next.js (port 3000) and `/api` + `/ws` to FastAPI (port 8000). |
| [`deploy/docker-compose.yml`](file:///c:/Users/heman/Desktop/Projects/pervekkala/deploy/docker-compose.yml) | Multi-container manifest orchestrating FastAPI backend, Next.js frontend, and Redis caching. |

---

## 2. Option 1: 1-Click AWS CloudFormation Deployment (Recommended)

No CLI required. Deploy directly through the AWS Web Console in **under 4 minutes**.

### Step 1: Log in to AWS Management Console
1. Navigate to the **AWS CloudFormation Console**: [https://console.aws.amazon.com/cloudformation/](https://console.aws.amazon.com/cloudformation/)
2. Set your region to **Asia Pacific (Mumbai) `ap-south-1`** (top right dropdown).

### Step 2: Create Stack
1. Click **Create stack** ➔ **With new resources (standard)**.
2. Under *Prerequisite - Prepare template*, select **Template is ready**.
3. Under *Specify template*, select **Upload a template file**.
4. Click **Choose file** and select [`deploy/aws_cloudformation.yaml`](file:///c:/Users/heman/Desktop/Projects/pervekkala/deploy/aws_cloudformation.yaml).
5. Click **Next**.

### Step 3: Specify Stack Details
1. **Stack name**: `aegis-cyber-production`
2. **InstanceType**: `t3.medium` (Default: 2 vCPU, 4 GB RAM — optimal balance of performance and low cost).
3. **KeyName**: Select your existing EC2 Key Pair (needed if you wish to SSH into the machine).
4. Click **Next**, keep defaults on the *Configure stack options* screen, and click **Submit**.

### Step 4: Access Live Deployed Application
1. Wait ~3 to 4 minutes until the Stack status reaches `CREATE_COMPLETE`.
2. Click on the **Outputs** tab. You will see your live public links:
   * **SimulationURL**: `http://<EC2-PUBLIC-IP>/simulation` *(Interactive 2D Dual-Mode Simulation)*
   * **DashboardURL**: `http://<EC2-PUBLIC-IP>/dashboard` *(Tactical Command Center)*
   * **ApiDocumentationURL**: `http://<EC2-PUBLIC-IP>:8000/docs` *(FastAPI Swagger Documentation)*

---

## 3. Option 2: Quick EC2 Launch via Bootstrap Script

If you prefer launching an EC2 instance manually:

### Step 1: Launch EC2 Instance
1. Go to **EC2 ➔ Launch an instance**.
2. **AMI**: Ubuntu 24.04 LTS (x86_64).
3. **Instance Type**: `t3.medium`.
4. **Key pair**: Choose or create a key pair.
5. **Network settings**:
   * Allow SSH traffic (`Port 22`).
   * Allow HTTP traffic (`Port 80`).
   * Allow HTTPS traffic (`Port 443`).
   * Add Custom TCP Rule for `Port 3000` and `Port 8000`.
6. **Storage**: 30 GiB gp3 SSD.
7. Click **Launch instance**.

### Step 2: Connect and Run Bootstrap Script
SSH into your instance:
```bash
ssh -i your-key.pem ubuntu@<YOUR-EC2-PUBLIC-IP>
```

Execute the single automated bootstrap command:
```bash
curl -sSL https://raw.githubusercontent.com/hemanth2607-cyber/aegis-cyber-cashout/main/deploy/setup_aws_ec2.sh | bash
```

The script will automatically:
- Update all Ubuntu packages.
- Install Docker Engine, Compose v2, and Nginx.
- Clone the repository from GitHub.
- Build and launch the multi-tier container stack.
- Configure Nginx reverse proxy on Port 80.
- Print your live public URLs on screen!

---

## 4. Option 3: Deploying with AWS CLI

If you have the AWS CLI configured on your computer:

```bash
# Create CloudFormation Stack in Mumbai (ap-south-1)
aws cloudformation create-stack \
  --stack-name aegis-production \
  --template-body file://deploy/aws_cloudformation.yaml \
  --parameters ParameterKey=KeyName,ParameterValue=YOUR_KEY_PAIR_NAME \
  --region ap-south-1

# Monitor Stack Creation Progress
aws cloudformation wait stack-create-complete \
  --stack-name aegis-production \
  --region ap-south-1

# View Live Application Outputs
aws cloudformation describe-stacks \
  --stack-name aegis-production \
  --query "Stacks[0].Outputs" \
  --output table \
  --region ap-south-1
```

---

## 5. Cloud-Native Enterprise Architecture for SIH Judges

When presenting to evaluators, showcase how Aegis scales across all 36 Indian States and Union Territories on AWS:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        AEGIS NATIONWIDE AWS CLOUD ARCHITECTURE                         │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
 1. INGESTION TIER                         ▼
    NCRP 1930 Cyber Fraud Stream ────► Amazon Kinesis Data Streams / Amazon MSK (Kafka)
                                           │
 2. SPATIO-TEMPORAL INFERENCE              ▼
    Velocity Decay Vk & Bayesian MAP ─► AWS ECS Fargate / AWS Lambda (Sub-50ms)
                                           │
 3. GEOSPATIAL & GRAPH STORAGE             ▼
    Uber H3 ATM Hexagons & Mules ────► Amazon OpenSearch Service + Amazon Neptune
                                           │
 4. FORENSIC EVIDENCE VAULT                ▼
    Sec 63 BSA Tamper-Proof Vault ───► Amazon S3 with S3 Object Lock (WORM Compliance)
                                           │
 5. LAW ENFORCEMENT DISPATCH               ▼
    ERSS Dial 112 CAD & NPCI Lien ───► Amazon SNS / Amazon EventBridge (Real-Time Webhooks)
```

### Cost Optimization Tips:
- **Free Tier Eligibility**: `t3.micro` or `t3.small` can be used for basic testing, but `t3.medium` (approx. $0.0416/hr or ~$1.00/day) is recommended during hackathon presentations to smoothly compile Next.js and run PyTorch/Scikit-Learn models in RAM.
- **Stop When Not in Use**: Remember to stop the EC2 instance or delete the CloudFormation stack after presentations to avoid ongoing charges.

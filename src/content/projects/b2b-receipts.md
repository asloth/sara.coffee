---
title: B2B Invoice Platform
summary: A design and working prototype for AI invoice extraction with a chat assistant, on AWS.
year: 2026
role: Solution design and development
cover: /work/b2b-receipts.webp
stack: [AWS Lambda, Bedrock, Aurora, SQS, S3, Terraform, React]
links:
  - { label: GitHub, href: "https://github.com/asloth/b2bplatform-receipts" }
order: 6
---

My answer to an architecture challenge: a B2B platform where clients upload PDF invoices, the system extracts and validates key fields, stores them, and lets users query them in a conversational interface. The brief sets 150k PDFs a month, a P95 extraction target under 8 seconds, an AI budget of USD 18k a month, and 20% provider rate limits at peak.

Besides the design docs (system design, API specs, AI evaluation, MLOps runbook), I built a working version. Uploads go through API Gateway, S3 and SQS to worker Lambdas, results land in Aurora, and low-confidence invoices go to a review screen with PDF preview and confidence bars. A `/chat` assistant on Bedrock answers questions about the invoices. Infrastructure is defined in Terraform.

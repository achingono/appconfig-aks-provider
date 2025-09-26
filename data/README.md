# Data Directory

This directory contains the Kaggle Amazon Books Reviews dataset used by the API.

## Contents

- `amazon-books-reviews.zip` - The downloaded dataset from Kaggle (automatically downloaded by deploy.sh)
- Extracted CSV files from the dataset (automatically extracted by deploy.sh)

## Dataset Source

The dataset is downloaded from: https://www.kaggle.com/datasets/mohamedbakhet/amazon-books-reviews

## Deployment Integration

The deploy.sh script automatically:
1. Downloads the dataset if it doesn't exist locally
2. Extracts the dataset files
3. Copies files into the minikube VM at `/mnt/data`
4. Makes the data available to the API pod at `/app/data/`


## Manual Dataset Management

If you need to manually download the dataset:

```bash
cd data
wget -O amazon-books-reviews.zip https://www.kaggle.com/api/v1/datasets/download/mohamedbakhet/amazon-books-reviews
unzip amazon-books-reviews.zip
```

Note: You may need to authenticate with Kaggle to download the dataset. The deploy script handles this automatically where possible.

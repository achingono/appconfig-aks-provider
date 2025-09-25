# Use the official Python image as the base image
FROM python:3.13-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY Pipfile .

# Install pipenv and system dependencies
RUN apk add --no-cache gcc musl-dev && \
    pip install pipenv

# Install the dependencies
RUN pipenv install --deploy --ignore-pipfile

# Copy the rest of the application code into the container
COPY . .

# Create config directory
RUN mkdir -p config

# Set environment variables
ENV PYTHON_ENV=development
ENV PORT=8080
ENV CONFIG_PATH=/app/settings.json

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["pipenv", "run", "python", "main.py"]
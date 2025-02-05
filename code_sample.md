## LambdaとAmazon Rekognitionの連携（2）

```python
import json
import boto3

def lambda_handler(event, context):
  bucket = '＜バケット名＞'
  photo = 'person_3.jpg'
  client = boto3.client('rekognition')
  response = client.detect_labels(Image={'S3Object':{'Bucket':bucket,'Name':photo}})
  person_count = 0
  for label in response['Labels']:
    if label['Name'] == 'Person':
      person_count = len(label['Instances'])
      print('person_count', person_count)
      
  return {
    'statusCode': 200,
    'body': json.dumps({'person_count': person_count})
  }
```

## S3とLambdaの連携（1）

```python
import json
import boto3

def lambda_handler(event, context):
  bucket = event['Records'][0]['s3']['bucket']['name']
  photo = event['Records'][0]['s3']['object']['key']
  client = boto3.client('rekognition')
  response = client.detect_labels(Image={'S3Object':{'Bucket':bucket,'Name':photo}})
  person_count = 0
  for label in response['Labels']:
    if label['Name'] == 'Person':
      person_count = len(label['Instances'])
      print('person_count', person_count)
      
  return {
    'statusCode': 200,
    'body': json.dumps({'person_count': person_count})
  }
```

## コードの追加

```python
from flask import Flask, Response, request
import optparse
from datetime import datetime as dt

@application.route('/hello', methods=['POST'])
def hello():
    payload = request.json
    result = {
        'message': 'Hello, %s!' % payload['name'],
        'datetime': dt.now().isoformat()
    }
    return Response(json.dumps(result), mimetype='application/json', status=200)
```

## さらにコードの追加（1）

```python
from flask_cors import CORS

application = Flask(__name__)
CORS(application)

@application.route('/calc', methods=['POST'])
def calc():
    payload = request.json
    result = {
        'answer': payload['a'] + payload['b']
    }
    return Response(json.dumps(result), mimetype='application/json', status=200)
```

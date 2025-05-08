

## Create image from text with Flux
```javascript
const options = {
  method: 'POST',
  headers: {'x-freepik-api-key': '<api-key>', 'Content-Type': 'application/json'},
  body: '{"prompt":"<string>","webhook_url":"https://www.example.com/webhook","aspect_ratio":"square_1_1","styling":{"effects":{"color":"softhue","framing":"portrait","lightning":"iridescent"},"colors":[{"color":"#FF0000","weight":0.5}]},"seed":2147483648}'
};

fetch('https://api.freepik.com/v1/ai/text-to-image/flux-dev', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
```
The flux API, through freepick, will respond with a JSON object for the task:
```json
{
  "data": {
    "task_id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
    "status": "IN_PROGRESS"
  }
}
```

Then, we must follow up with a GET request to the task ID to get the result:
```javascript
const options = {method: 'GET', headers: {'x-freepik-api-key': '<api-key>'}};

fetch('https://api.freepik.com/v1/ai/text-to-image/flux-dev/{task-id}', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
```

The result will be a JSON object with the image URL:
```json
{
  "data": {
    "task_id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
    "status": "COMPLETED",
    "result": {
      "image_url": "https://api.freepik.com/v1/ai/text-to-image/flux-dev/{task-id}/image"
    }
  }
}
```

## Create an image from text with Mystic
```javascript
const options = {
  method: 'POST',
  headers: {'x-freepik-api-key': '<api-key>', 'Content-Type': 'application/json'},
  body: '{"prompt":"<string>","webhook_url":"https://www.example.com/webhook","structure_reference":"aSDinaTvuI8gbWludGxpZnk=","structure_strength":50,"style_reference":"aSDinaTvuI8gbWludGxpZnk=","adherence":50,"hdr":50,"resolution":"2k","aspect_ratio":"square_1_1","model":"realism","creative_detailing":33,"engine":"automatic","fixed_generation":false,"filter_nsfw":true,"styling":{"styles":[{"name":"<string>","strength":100}],"characters":[{"id":"<string>","strength":100}],"colors":[{"color":"#FF0000","weight":0.5}]}}'
};

fetch('https://api.freepik.com/v1/ai/mystic', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
```

The result will be a JSON object with the image URL:
```json
{
  "data": {
    "generated": [
      "https://ai-statics.freepik.com/completed_task_image.jpg"
    ],
    "task_id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
    "status": "COMPLETED",
    "has_nsfw": [
      false
    ]
  }
}
```

## Create an illustration with Loras
```javascript
const options = {method: 'GET', headers: {'x-freepik-api-key': '<api-key>'}};

fetch('https://api.freepik.com/v1/ai/loras', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
```

The result will be a JSON object with the image URL:
```json
{
  "data": {
    "default": [
      {
        "id": 1,
        "name": "vintage-japanese",
        "description": "Expect bold red colors and a sense of nostalgia, bringing to life classic Japanese elements.",
        "category": "illustration",
        "type": "style",
        "training": {
          "status": "completed",
          "defaultScale": 1.2
        }
      },
      {
        "id": 2,
        "name": "sara",
        "description": "sara",
        "category": "people",
        "type": "character",
        "training": {
          "status": "completed",
          "defaultScale": 1.2
        }
      },
      {
        "id": 3,
        "name": "glasses",
        "description": "glasses",
        "category": "glasses",
        "type": "product",
        "training": {
          "status": "completed",
          "defaultScale": 1.2
        }
      }
    ],
    "customs": []
  }
}
```

### Loras trained with Custom Styles
```javascript
const options = {
  method: 'POST',
  headers: {'x-freepik-api-key': '<api-key>', 'Content-Type': 'application/json'},
  body: '{"name":"my-awesome-style","description":"string","quality":"high","images":["string","string","string","string","string","string","string","string"],"webhook_url":"https://my-webhook-url.com/endpoint"}'
};

fetch('https://api.freepik.com/v1/ai/loras/styles', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
```

The result will be a JSON object with the image URL:

```json
{
  "generated": [],
  "task_id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
  "task_status": "IN_PROGRESS"
}
```



---
---

From the [API Reference](https://docs.perplexity.ai/api-reference/chat-completions)
```javascript
const options = {
  method: 'POST',
  headers: {Authorization: 'Bearer <token>', 'Content-Type': 'application/json'},
  body: '{"model":"sonar",
  "messages":[{"role":"system","content":"Be precise and concise."},{"role":"user","content":"How many stars are there in our galaxy?"}],
  "max_tokens":123,
  "temperature":0.2,
  "top_p":0.9,
  "search_domain_filter":["<any>"],
  "return_images":false,
  "return_related_questions":false,
  "search_recency_filter":"<string>",
  "top_k":0,
  "stream":false,
  "presence_penalty":0,
  "frequency_penalty":1,
  "response_format":{},
  "web_search_options":{"search_context_size":"high"}}'
};

fetch('https://api.perplexity.ai/chat/completions', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
```

From the [Structured Outputs Guide](https://docs.perplexity.ai/guides/structured-outputs) on the Perplexity AI Docs
```javascript
import requests
from pydantic import BaseModel

class AnswerFormat(BaseModel):
    first_name: str
    last_name: str
    year_of_birth: int
    num_seasons_in_nba: int

url = "https://api.perplexity.ai/chat/completions"
headers = {"Authorization": "Bearer YOUR_API_KEY"}
payload = {
    "model": "sonar",
    "messages": [
        {"role": "system", "content": "Be precise and concise."},
        {"role": "user", "content": (
            "Tell me about Michael Jordan. "
            "Please output a JSON object containing the following fields: "
            "first_name, last_name, year_of_birth, num_seasons_in_nba. "
        )},
    ],
    "response_format": {
		    "type": "json_schema",
        "json_schema": {"schema": AnswerFormat.model_json_schema()},
    },
}
response = requests.post(url, headers=headers, json=payload).json()
print(response["choices"][0]["message"]["content"])
```

```javascript
{"first_name":"Michael","last_name":"Jordan","year_of_birth":1963,"num_seasons_in_nba":15}
```
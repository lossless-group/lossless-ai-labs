
Perplexica's source documentation is available here:
(Perplexica Source Documentation)[https://github.com/ItzCrazyKns/Perplexica/blob/master/docs/API/SEARCH.md]


```json
{
  "chatModel": {
    "provider": "openai",
    "name": "gpt-4o-mini"
  },
  "embeddingModel": {
    "provider": "openai",
    "name": "text-embedding-3-large"
  },
  "optimizationMode": "speed",
  "focusMode": "webSearch",
  "query": "What is Perplexica",
  "history": [
    ["human", "Hi, how are you?"],
    ["assistant", "I am doing well, how can I help you today?"]
  ],
  "systemInstructions": "Focus on providing technical details about Perplexica's architecture.",
  "stream": false
}
```

A history can be accessed with: 
```json
[
  ["human", "What is Perplexica?"],
  ["assistant", "Perplexica is an AI-powered search engine..."]
]
```

Example of non-streamed response:
```json
{
  "message": "Perplexica is an innovative, open-source AI-powered search engine designed to enhance the way users search for information online. Here are some key features and characteristics of Perplexica:\n\n- **AI-Powered Technology**: It utilizes advanced machine learning algorithms to not only retrieve information but also to understand the context and intent behind user queries, providing more relevant results [1][5].\n\n- **Open-Source**: Being open-source, Perplexica offers flexibility and transparency, allowing users to explore its functionalities without the constraints of proprietary software [3][10].",
  "sources": [
    {
      "pageContent": "Perplexica is an innovative, open-source AI-powered search engine designed to enhance the way users search for information online.",
      "metadata": {
        "title": "What is Perplexica, and how does it function as an AI-powered search ...",
        "url": "https://askai.glarity.app/search/What-is-Perplexica--and-how-does-it-function-as-an-AI-powered-search-engine"
      }
    },
    {
      "pageContent": "Perplexica is an open-source AI-powered search tool that dives deep into the internet to find precise answers.",
      "metadata": {
        "title": "Sahar Mor's Post",
        "url": "https://www.linkedin.com/posts/sahar-mor_a-new-open-source-project-called-perplexica-activity-7204489745668694016-ncja"
      }
    }
        ....
  ]
}
```

Example of streamed response:
```json
{"type":"init","data":"Stream connected"}
{"type":"sources","data":[{"pageContent":"...","metadata":{"title":"...","url":"..."}},...]}
{"type":"response","data":"Perplexica is an "}
{"type":"response","data":"innovative, open-source "}
{"type":"response","data":"AI-powered search engine..."}
{"type":"done"}
```

Clients should process each line as a separate JSON object. The different message types include:

- init: Initial connection message
- sources: All sources used for the response
- response: Chunks of the generated answer text
done: Indicates the stream is complete

Fields in the Response
- message (string): The search result, generated based on the query and focus mode.
sources (array): A list of sources that were used to generate the search result. Each source includes:
   - pageContent: A snippet of the relevant content from the source.
   - metadata: Metadata about the source, including:
   - title: The title of the webpage.
   - url: The URL of the webpage.

Error Handling
If an error occurs during the search process, the API will return an appropriate error message with an HTTP status code.

- 400: If the request is malformed or missing required fields (e.g., no focus mode or query).
- 500: If an internal server error occurs during the search.
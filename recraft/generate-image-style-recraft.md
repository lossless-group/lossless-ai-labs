
# Docs
https://www.recraft.ai/docs#authentication

# Create style
Upload a set of images to create a style reference.
```python
POST https://external.api.recraft.ai/v1/styles

from openai import OpenAI

client = OpenAI(base_url='https://external.api.recraft.ai/v1', api_key=_RECRAFT_API_TOKEN)

style = client.post(
    path='/styles',
    cast_to=object,
    options={'headers': {'Content-Type': 'multipart/form-data'}},
    body={'style': 'digital_illustration'},
    files={'file': open('image.png', 'rb')},
)
print(style['id'])

response = client.images.generate(
    prompt='wood potato masher',
    extra_body={'style_id': style['id']},
)
print(response.data[0].url)
```

Output
```json
{"id": "229b2a75-05e4-4580-85f9-b47ee521a00d"}
```
Request Body
Upload a set of images to create a style reference.

Parameter	Type	Description
style (required)	string	The base style of the generated images, this topic is covered above.
files (required)	files	Images in PNG format for using as style references. The max number of the images is 5. Total size of all images is limited to 5MB.

## Images to input for Style:
`/Users/mpstaton/code/lossless-monorepo/content/visuals/Illustration__Creative-Assembly-Line.png`
`/Users/mpstaton/code/lossless-monorepo/content/visuals/pictographOf_AI-Consumer.png`
`/Users/mpstaton/code/lossless-monorepo/content/visuals/pictographOf_Assembly-Line.png`
`/Users/mpstaton/code/lossless-monorepo/content/visuals/pictographOf_BusinessStrategy.png`

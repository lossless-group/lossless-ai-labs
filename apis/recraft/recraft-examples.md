
[Docs](https://www.recraft.ai/docs)

## Setup

```python
from openai import OpenAI

client = OpenAI(
    base_url='https://external.api.recraft.ai/v1',
    api_key=<TOKEN>,
)
```
## Generate an Image from a Prompt

```python
POST https://external.api.recraft.ai/v1/images/generations
response = client.images.generate(
    prompt='race car on a track',
    style='vector_illustration',
)
print(response.data[0].url)
```

## Generate an Image from a Prompt with Custom Styles and Controls

```python
response = client.images.generate(
    prompt='race car on a track',
    extra_body={
        'style_id': style_id,
        'controls': {
            ...
        }
    }
)
print(response.data[0].url)
```

```python
POST https://external.api.recraft.ai/v1/images/vectorize
response = client.post(
    path='/images/vectorize',
    cast_to=object,
    options={'headers': {'Content-Type': 'multipart/form-data'}},
    files={'file': open('image.png', 'rb')},
)
print(response['image']['url'])
```

```yaml
image_prompt: "A clean, organized dashboard with toggles and dropdowns for user configuration, surrounded by code snippets and directory icons, in a modern developer workspace."
banner_image: https://img.recraft.ai/HqVG73rdBVEQLF7TIQMVdxjLt5r2R1JT_AE0747u45U/rs:fit:1024:1024:0/raw:1/plain/abs://external/images/8b31313d-631f-41d7-8cc4-baa2c4b89db1

image_prompt: "A code editor filled with colorful, well-structured comments, section headers, and documentation blocks, symbolizing clarity and comprehensive code annotation."
banner_image: https://img.recraft.ai/A5yzBd2hFwGMTfzpY5FbkUYaqW2MT0_WX9pVQddbSss/rs:fit:1024:1024:0/raw:1/plain/abs://external/images/9e584dce-5ef8-4b29-ae86-eaa30e9b0f83

image_prompt: "Abstract representation of modular UI components, each with distinct styles and icons, being assembled like building blocks in a developer's workspace."
banner_image: https://img.recraft.ai/peUaEaVG--ZS6hUtW968ElW-2cj3ZaoYVTm43HANASo/rs:fit:1024:1024:0/raw:1/plain/abs://external/images/83f4563c-043e-44d9-9ec3-87945e493e1e

image_prompt: "A split-screen showing Tailwind utility classes transforming into organized CSS files, with a modern interface and visual cues for maintainability and style."
banner_image: https://img.recraft.ai/Eldf53sQMzPSVjv0faUUUSmWvYngfM2FdaRk-bmIzgs/rs:fit:1024:1024:0/raw:1/plain/abs://external/images/19701037-ca12-4f42-8266-5d86b0f096ab

image_prompt: "A seamless flow of interactive UI elements demonstrating smooth CSS transitions and animations, with hover effects and consistent design patterns."
banner_image: https://img.recraft.ai/gG8ToeQsWYD7EPTrcoDdK8x2OMI0q-UvgiqdCKdeRXI/rs:fit:1024:1024:0/raw:1/plain/abs://external/images/525c23d0-c300-47a5-a148-c3668612679b

image_prompt: "A thoughtful developer reviewing code and suggesting improvements, surrounded by branching diagrams and preserved legacy code, symbolizing careful, non-destructive refactoring."
banner_image: https://img.recraft.ai/WY8shU44XQmGnjciMAFDZFcjb2ye0ecl-1r39_9cCfw/rs:fit:1024:1024:0/raw:1/plain/abs://external/images/9ef2b439-31a8-437e-aa26-0245cdfdb157

image_prompt: "A clean, organized dashboard with toggles and dropdowns for user configuration, surrounded by code snippets and directory icons, in a modern developer workspace."
banner_image: https://img.recraft.ai/xDT6T2QQF5AAOE2BhSIqmrlx9_UuUi2B5OrqzTlqnLI/rs:fit:1024:1024:0/raw:1/plain/abs://external/images/8d6d9b40-5184-4874-9c97-ed4f417fbd32

image_prompt: "A code editor filled with colorful, well-structured comments, section headers, and documentation blocks, symbolizing clarity and comprehensive code annotation."
banner_image: https://img.recraft.ai/C1mFu9GJgAwkoGTtJE6TV9XXCOgvEJOzSsuL0G5VP7A/rs:fit:1024:1024:0/raw:1/plain/abs://external/images/45f0e73c-25d8-4ebb-b77c-e9668aee562a

image_prompt: "Abstract representation of modular UI components, each with distinct styles and icons, being assembled like building blocks in a developer's workspace."
banner_image: https://img.recraft.ai/-LRObveEB_P55O3wfYZxxMd-XJj2wMR9fdnJb8Py-80/rs:fit:1024:1024:0/raw:1/plain/abs://external/images/d5b214e9-01fe-43c1-bd74-35042b3eb218

image_prompt: "A split-screen showing Tailwind utility classes transforming into organized CSS files, with a modern interface and visual cues for maintainability and style."
banner_image: https://img.recraft.ai/btWapED9eChnGdUm5qWFa02mfSUdYB0qe6rXQpc59UI/rs:fit:1024:1024:0/raw:1/plain/abs://external/images/93ab9461-fc4b-4c66-8108-79935c5fa604

image_prompt: "A seamless flow of interactive UI elements demonstrating smooth CSS transitions and animations, with hover effects and consistent design patterns."
banner_image: https://img.recraft.ai/viCeanFXAOgQEXLnyI0PxM3jziwbu_NZuLOkaiyWnjY/rs:fit:1024:1024:0/raw:1/plain/abs://external/images/eb2860e9-a1e7-432f-86c5-761b6487615f

image_prompt: "A thoughtful developer reviewing code and suggesting improvements, surrounded by branching diagrams and preserved legacy code, symbolizing careful, non-destructive refactoring."
banner_image: https://img.recraft.ai/OG3lXP5tuwwRkiKHsB8Fwrwc1vz5p7Vw7LT7bzsBFpk/rs:fit:1024:1024:0/raw:1/plain/abs://external/images/bffc5fdb-425a-481f-8695-9503fda536c3


```




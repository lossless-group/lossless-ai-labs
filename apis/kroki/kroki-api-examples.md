---
date_created: 2025-05-18
date_modified: 2025-05-18
---

Calling Kroki API with a POST request:

```bash
curl https://kroki.io/graphviz/svg --data-raw 'digraph G {Hello->World}'
```


```json
{
  "diagram_source": "digraph G {Hello->World}",
  "diagram_type": "graphviz",
  "output_format": "svg"
}
```

Calling Kroki API with a GET request:

```bash

```

Calling Kroki with (HTTPie)[https://httpie.io/] JSON request:

```bash
http https://kroki.io/ diagram_type='graphviz' output_format='svg' diagram_source='digraph G {Hello->World}'
```

Send a file to Kroki:


```text project.erd
[Person]
*name
height
weight
+birth_location_id

[Location]
*id
city
state
country

Person *--1 Location
```

```bash
curl https://kroki.io/erd/svg --data-binary '@project.erd'
```



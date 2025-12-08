# Cards mapping

## Content field mapping

content should be mapped according to this table:

| **type**      | **name**       | **value**              |
| :------------ | :------------- | :--------------------- |
| `description` |                | `input.description` |
| `flavor`      |                | `input.flavorText`     |

## Common fields mapping

| **Output field** | **Input field**                         |
| :--------------- |:----------------------------------------|
| `slug`           | `input.slug`                            |
| `title`          | `input.name`                            |
| `subTitle`       | `input.description`                     |
| `icon`           | `input.iconUrl`                         |
| `color`          | `input.colors[0]`                       |
| `groupName`      | `Cards`                                 |
| `iconStyle`      | `'square-rounded'`                      |
| `content`        | use content value form previous mapping |

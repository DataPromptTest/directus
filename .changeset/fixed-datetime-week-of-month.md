---
'@directus/app': patch
---

Fixed the `W` (week of month) Unicode TR35 symbol being rejected in datetime custom formats, which displayed an unexpected error instead of the week number

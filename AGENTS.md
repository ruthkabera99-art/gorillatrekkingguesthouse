# Project conventions
- Website customization is persisted as one `site_content` setting and distributed through a shared store; draft edits must not modify visitor content before a successful save.
- Use `SiteLink` for administrator-configured destinations so unsafe URL schemes are blocked and home-section links work from every page.
- Apply configurable colours and fonts through `siteTheme` semantic tokens for both saved themes and draft previews, preserving readable foreground contrast.
- Website Design saves verify the current Auth user against the editor account and publish only the returned persisted row; existing database RLS enforces administrator writes.
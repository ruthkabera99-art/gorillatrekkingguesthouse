# Project conventions
- Website customization is persisted as one `site_content` setting and distributed through a shared store; draft edits must not modify visitor content before a successful save.
- Use `SiteLink` for administrator-configured destinations so unsafe URL schemes are blocked and home-section links work from every page.
- Apply configurable colours and fonts through `siteTheme` semantic tokens for both saved themes and draft previews, preserving readable foreground contrast.
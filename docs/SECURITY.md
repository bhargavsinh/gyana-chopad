# Security notes (static site)

Practical measures:

1. Sanitize player display names (no HTML injection)
2. No backend, no auth cookies for the game itself
3. CSP on index and policy pages
4. Relative asset paths
5. Report issues via GitHub

There is no commercial “level 4 ultra security product” — these are real controls for a client-only educational game.

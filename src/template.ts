export const pageTemplate = `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>__COLOR_HEX__</title>
  <link rel="preload" href="/assets/style.css" as="style">
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap" as="style">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap">
  <link rel="preload" href="/assets/script.js" as="script">
  <link rel="stylesheet" href="/assets/style.css">
  <link id="favicon" rel="icon"
    href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22__COLOR_HEX_URL_ENCODED__%22/></svg>">
  <style>
    /* 极简的关键路径样式，避免 FOUC (Flash of Unstyled Content) */
    body { margin: 0; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 2em; box-sizing: border-box; background-color: __COLOR_HEX__; }
  </style>
</head>

<body>
  <canvas id="gl-canvas"></canvas>
  <div class="overlay">
    <div class="hex-wrapper">
      <div id="time-hex" class="time-display"></div>
      <div id="color-count" class="color-count"></div>
    </div>
    <div class="time-divider"></div>
    <div id="time-utc" class="time-display"></div>
    <div id="time-utc8" class="time-display"></div>
  </div>

  <script>
    window.INITIAL_COLOR = "__COLOR_HEX__";
  </script>
  <script src="/assets/script.js" defer></script>
</body>

</html>
`;
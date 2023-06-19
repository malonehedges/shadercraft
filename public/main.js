window.onload = () => {
  const canvas = document.getElementById("canvas");
  const gl = canvas.getContext("webgl");
  const widthRange = document.getElementById("widthRange");
  const heightRange = document.getElementById("heightRange");
  const widthInput = document.getElementById("widthNumber");
  const heightInput = document.getElementById("heightNumber");
  const timeElement = document.getElementById("time");
  const fpsElement = document.getElementById("fps");

  if (!gl) {
    alert("WebGL is not available in your browser");
    return;
  }

  const vertexShaderSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  canvas.width = widthRange.value;
  canvas.height = heightRange.value;
  gl.viewport(0, 0, canvas.width, canvas.height);

  let shaderString = null;
  let animationId = null;

  const updateShaders = () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }

    const fragmentShaderSource = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      ${shaderString ?? ""}
      void main() {
        mainImage(gl_FragColor, gl_FragCoord.xy);
      }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(fragmentShader));
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
    const iTimeLocation = gl.getUniformLocation(program, "iTime");

    canvas.width = widthRange.value;
    canvas.height = heightRange.value;

    gl.uniform2f(iResolutionLocation, canvas.width, canvas.height);

    let lastTime = performance.now();
    let frameCount = 0;

    const startTime = Date.now();
    function render() {
      const elapsedMilliseconds = Date.now() - startTime;
      const elapsedSeconds = elapsedMilliseconds / 1000.0;
      gl.uniform1f(iTimeLocation, elapsedSeconds);

      const now = performance.now();
      const deltaTime = now - lastTime;
      frameCount++;

      timeElement.textContent = `Time: ${elapsedSeconds.toFixed(2)}s`;
      if (deltaTime >= 1000) {
        fpsElement.textContent = `FPS: ${Math.round(frameCount)}`;
        frameCount = 0;
        lastTime = now;
      }

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationId = requestAnimationFrame(render);
    }

    render();
  };

  updateShaders();

  const eventSource = new EventSource("/events");
  eventSource.onmessage = (event) => {
    shaderString = JSON.parse(event.data);
    updateShaders();
  };

  let updateSize = () => {
    canvas.width = widthRange.value;
    canvas.height = heightRange.value;
    gl.viewport(0, 0, canvas.width, canvas.height);
    updateShaders();
  };

  widthRange.oninput =
    widthInput.oninput =
    heightRange.oninput =
    heightInput.oninput =
      () => {
        updateSize();
      };
};

document.getElementById("widthRange").addEventListener("input", function () {
  document.getElementById("widthNumber").value = this.value;
});

document.getElementById("widthNumber").addEventListener("input", function () {
  document.getElementById("widthRange").value = this.value;
});

document.getElementById("heightRange").addEventListener("input", function () {
  document.getElementById("heightNumber").value = this.value;
});

document.getElementById("heightNumber").addEventListener("input", function () {
  document.getElementById("heightRange").value = this.value;
});

document
  .getElementById("screenshotButton")
  .addEventListener("click", function () {
    requestAnimationFrame(() => {
      let link = document.createElement("a");
      link.download = "screenshot.png";

      let tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.clientWidth;
      tempCanvas.height = canvas.clientHeight;

      tempCanvas
        .getContext("2d")
        .drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

      link.href = tempCanvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      link.click();
    });
  });

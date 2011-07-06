var shader, buffers;

function init_shaders () {
  // 二つの shader を読み込む
  shader = GL.shader();
  shader.attach('vertex.shdr', gl.VERTEX_SHADER);
  shader.attach('fragment.shdr', gl.FRAGMENT_SHADER);
  shader.link();
  shader.use();

  // vertex shader で宣言された属性や変数を JS の環境に束縛する
  shader.attribute('vPos');
  shader.uniform('P');
  shader.uniform('MV');
}

function init_buffers() {
  // 三角形と正方形の形状をバッファに記憶する．
  buffers = {
    triangle:
    GL.shape_buffer(3, gl.TRIANGLES, [
      +0.0, +1.0,  0.0,
      -1.0, -1.0,  0.0,
      +1.0, -1.0,  0.0 ]),

    square:
    GL.shape_buffer(3, gl.TRIANGLE_STRIP, [
      +1.0, +1.0,  0.0,
      -1.0, +1.0,  0.0,
      +1.0, -1.0,  0.0,
      -1.0, -1.0,  0.0 ])
  };
}

var matrix = {
  P:  mat4.create(),
  MV: mat4.create(),
  // JS で計算した projection matrix と model-view matrix の情報を GPU に伝える．
  set_uniforms: function () {
    gl.uniformMatrix4fv(shader.P.u,  false, this.P);
    gl.uniformMatrix4fv(shader.MV.u, false, this.MV);
  }
};

function draw() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  mat4.perspective(45, GL.viewport.w / GL.viewport.h, 0.1, 100, matrix.P);
  mat4.identity(matrix.MV);

  mat4.translate(matrix.MV, [-1.5, 0.0, -7.0]);
  buffers.triangle.set_shape(shader.a.vPos);
  matrix.set_uniforms();
  buffers.triangle.draw();

  mat4.translate(matrix.MV, [3.0, 0.0, 0.0]);
  buffers.square.set_shape(shader.a.vPos);
  matrix.set_uniforms();
  buffers.square.draw();
}

$(function () {
    var canvas = $('<canvas>').attr({
        width: 500, height: 500,
        style: 'border: none;' }).appendTo($(document.body))[0];
    initGL(canvas);
    init_shaders();
    init_buffers();

    // Clear するときに使用する色の宣言
    gl.clearColor(0, 0, 0, 1);

    gl.enable(gl.DEPTH_TEST);

    setInterval(draw, 500);
});

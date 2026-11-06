(() => {
  'use strict';
  const KEY = 'gametsukuru-js-language';
  const rows = [
    ['WEB EDITION','EDICIÓN WEB','ウェブ版'],['File','Archivo','ファイル'],['Edit','Editar','編集'],['Add','Añadir','追加'],['Run','Ejecutar','実行'],['Stop','Detener','停止'],['Window','Ventana','ウィンドウ'],['Help','Ayuda','ヘルプ'],['Language','Idioma','言語'],
    ['New project','Nuevo proyecto','新規プロジェクト'],['Open project…','Abrir proyecto…','プロジェクトを開く…'],['Save project','Guardar proyecto','プロジェクトを保存'],['Export JSON…','Exportar JSON…','JSON を書き出す…'],['Export playable HTML…','Exportar HTML jugable…','プレイ用 HTML を書き出す…'],['Load sample game','Explorar juegos de ejemplo','サンプルゲームを見る'],
    ['Duplicate selected','Duplicar selección','選択項目を複製'],['Rename selected','Renombrar selección','選択項目の名前を変更'],['Delete selected','Eliminar selección','選択項目を削除'],['Show all resources','Mostrar todos los recursos','すべてのリソースを表示'],['Close windows','Cerrar ventanas','ウィンドウを閉じる'],['Dark mode','Modo oscuro','ダークモード'],
    ['Sprite','Sprite','スプライト'],['Sprites','Sprites','スプライト'],['Sound','Sonido','サウンド'],['Sounds','Sonidos','サウンド'],['Background','Fondo','背景'],['Backgrounds','Fondos','背景'],['Path','Ruta','パス'],['Paths','Rutas','パス'],['Script','Script','スクリプト'],['Scripts','Scripts','スクリプト'],['Time Lines','Líneas de tiempo','タイムライン'],['Timeline','Línea de tiempo','タイムライン'],['Object','Objeto','オブジェクト'],['Objects','Objetos','オブジェクト'],['Room','Sala','ルーム'],['Rooms','Salas','ルーム'],['Data Files','Archivos de datos','データファイル'],['Data File','Archivo de datos','データファイル'],
    ['RESOURCES','RECURSOS','リソース'],['Find a resource','Buscar un recurso','リソースを検索'],['＋ Add resource','＋ Añadir recurso','＋ リソースを追加'],['Add resource','Añadir recurso','リソースを追加'],['Empty','Vacío','空'],['Game Information','Información del juego','ゲーム情報'],['Game Options','Opciones del juego','ゲーム設定'],
    ['Your workspace is ready','Tu espacio de trabajo está listo','作業スペースの準備ができました'],['Choose a resource in the left panel to edit it.','Elige un recurso en el panel izquierdo para editarlo.','左のパネルから編集するリソースを選んでください。'],['Explore the sample game','Explorar juegos de ejemplo','サンプルゲームを見る'],['Ready','Listo','準備完了'],['Ready · Click a resource to edit it','Listo · Elige un recurso para editarlo','準備完了・編集するリソースを選択'],['JavaScript game editor · F5 to play','Editor de juegos JavaScript · F5 para jugar','JavaScript ゲームエディター・F5 でプレイ'],['Saved in this browser','Guardado en este navegador','このブラウザーに保存済み'],
    ['GAME PREVIEW','VISTA PREVIA DEL JUEGO','ゲームプレビュー'],['Touchscreen controls','Controles táctiles','タッチ操作ボタン'],['↻ Restart','↻ Reiniciar','↻ 再起動'],['Arrow keys / WASD to move · Click inside the game to focus','Flechas / WASD para mover · Haz clic en el juego para enfocarlo','矢印キー / WASD で移動・ゲーム内をクリックして操作'],['Close preview','Cerrar vista previa','プレビューを閉じる'],['Restart','Reiniciar','再起動'],
    ['Explore games','Explorar juegos','ゲームを探す'],['Loading games…','Cargando juegos…','ゲームを読み込み中…'],['Choose a game to open in the editor.','Elige un juego para abrirlo en el editor.','エディターで開くゲームを選んでください。'],['No games are available yet.','Todavía no hay juegos disponibles.','利用できるゲームはまだありません。'],['Could not load the games list:','No se pudo cargar la lista de juegos:','ゲーム一覧を読み込めませんでした：'],['Could not open game:','No se pudo abrir el juego:','ゲームを開けませんでした：'],
    ['Name:','Nombre:','名前：'],['Sprite:','Sprite:','スプライト：'],['Solid','Sólido','固体'],['Collision detection','Detección de colisiones','当たり判定'],['Bounding box collision detection','Detección por caja delimitadora','境界ボックスの当たり判定'],['Pixel perfect collision detection','Detección de colisiones por píxel','ピクセル単位の当たり判定'],['Visible','Visible','表示'],['Depth:','Profundidad:','深度：'],['Alpha:','Opacidad:','不透明度：'],['Preview','Vista previa','プレビュー'],['Events','Eventos','イベント'],['No events yet','Todavía no hay eventos','イベントはまだありません'],['Change','Cambiar','変更'],['Delete','Eliminar','削除'],['Actions ·','Acciones ·','アクション・'],['choose event','elige un evento','イベントを選択'],['Action palette','Paleta de acciones','アクションパレット'],['Move','Mover','移動'],['Jump','Saltar','ジャンプ'],['React','Reaccionar','反応'],['Main 1','Principal 1','メイン 1'],['Score','Puntuación','スコア'],['Draw','Dibujar','描画'],['Create','Crear','作成'],['Step','Paso','ステップ'],['Keyboard: Left','Teclado: izquierda','キーボード：左'],['Keyboard: Right','Teclado: derecha','キーボード：右'],['Keyboard: Up','Teclado: arriba','キーボード：上'],['Keyboard: Down','Teclado: abajo','キーボード：下'],['Keyboard: Space','Teclado: espacio','キーボード：スペース'],['Keyboard: B','Teclado: B','キーボード：B'],['Touch controls selected','Controles táctiles seleccionados','タッチ操作を選択'],['Keyboard controls selected','Controles de teclado seleccionados','キーボード操作を選択'],['Mouse: Left click','Ratón: clic izquierdo','マウス：左クリック'],['Collision','Colisión','衝突'],
    ['Settings','Ajustes','設定'],['Views','Vistas','表示'],['Enable view','Activar vista','ビューを有効にする'],['Camera view','Vista de cámara','カメラビュー'],['Follow object:','Seguir objeto:','追跡するオブジェクト：'],['Edit objects','Editar objetos','オブジェクトを編集'],['＋ Place','＋ Colocar','＋ 配置'],['⌫ Erase','⌫ Borrar','⌫ 消去'],['Object to add:','Objeto para añadir:','追加するオブジェクト：'],['(select object)','(elige un objeto)','（オブジェクトを選択）'],['Snap to grid','Ajustar a la cuadrícula','グリッドに合わせる'],['Show grid','Mostrar cuadrícula','グリッドを表示'],['Delete selected instance','Eliminar instancia seleccionada','選択したインスタンスを削除'],['Width:','Ancho:','幅：'],['Height:','Alto:','高さ：'],['Grid:','Cuadrícula:','グリッド：'],['Color:','Color:','色：'],['Image:','Imagen:','画像：'],['(none)','(ninguno)','（なし）'],['(no sprite)','(sin sprite)','（スプライトなし）'],['▶ Run room','▶ Ejecutar sala','▶ ルームを実行'],
    ['Sprite options','Opciones del sprite','スプライト設定'],['Precise collision checking','Detección precisa de colisiones','精密な当たり判定'],['Transparent','Transparente','透明'],['Origin','Origen','原点'],['Center origin','Centrar origen','原点を中央に'],['📂 Load Sprite','📂 Cargar sprite','📂 スプライトを読み込む'],['🎨 Edit Sprite','🎨 Editar sprite','🎨 スプライトを編集'],['Clear','Borrar','クリア'],['📂 Load Sound','📂 Cargar sonido','📂 サウンドを読み込む'],['▶ Preview','▶ Vista previa','▶ プレビュー'],['Microphone recorder','Grabadora de micrófono','マイク録音'],['● Record','● Grabar','● 録音'],['■ Stop recording','■ Detener grabación','■ 録音を停止'],['📂 Load Background','📂 Cargar fondo','📂 背景を読み込む'],
    ['Cancel','Cancelar','キャンセル'],['Continue','Continuar','続行'],['Close','Cerrar','閉じる'],['Save','Guardar','保存'],['OK','Aceptar','OK'],['New project created','Nuevo proyecto creado','新しいプロジェクトを作成しました'],['Create new project?','¿Crear un proyecto nuevo?','新しいプロジェクトを作成しますか？'],['Your current project stays in the browser until replaced. Export it first if you want a separate copy.','El proyecto actual se reemplazará. Expórtalo primero si quieres conservar una copia.','現在のプロジェクトは置き換えられます。別に保存するには先に書き出してください。'],
    ['Choose an event, then add actions from the palette.','Elige un evento y añade acciones de la paleta.','イベントを選び、パレットからアクションを追加します。'],['Choose an icon to add an action.','Elige un icono para añadir una acción.','アイコンを選んでアクションを追加します。'],['Click or drag an icon into the action list.','Haz clic o arrastra un icono a la lista de acciones.','アイコンをクリックするか、アクション一覧にドラッグします。'],['Click the room to place an object. Drag an instance to move it.','Haz clic en la sala para colocar un objeto. Arrastra una instancia para moverla.','ルームをクリックしてオブジェクトを配置します。ドラッグして移動します。'],['The room size sets the playable area. Use Views to set the visible area.','El tamaño de la sala determina el área de juego. Usa Vistas para definir el área visible.','ルームのサイズはプレイ領域を決めます。表示領域は「ビュー」で設定します。'],['The selected background fills the room when the game runs.','El fondo seleccionado llena la sala durante el juego.','選択した背景がプレイ中のルームを埋めます。'],['The view follows the first instance of the selected object and stops at the room edges. Make the room larger than the view to scroll. The outline shows the starting view.','La vista sigue la primera instancia del objeto seleccionado y se detiene en los límites de la sala. Haz la sala más grande que la vista para desplazarte. El contorno muestra la vista inicial.','ビューは選択したオブジェクトの最初のインスタンスを追跡し、ルームの端で止まります。スクロールするにはルームをビューより大きくします。枠は開始時のビューを示します。'],['Choose an object on the left, then click here to place it.','Elige un objeto a la izquierda y haz clic aquí para colocarlo.','左でオブジェクトを選び、ここをクリックして配置します。'],
    ['Write a JavaScript function here. Add a Run Script action to an object event to call it.','Escribe una función JavaScript aquí. Añade Ejecutar script a un evento de objeto para llamarla.','ここに JavaScript 関数を書きます。オブジェクトのイベントに「スクリプトを実行」を追加して呼び出します。'],['Function parameters: self, api, game, other','Parámetros: self, api, game, other','関数の引数：self, api, game, other'],['Load an audio file or record one with your microphone.','Carga un archivo de audio o graba uno con el micrófono.','音声ファイルを読み込むか、マイクで録音してください。'],['Sound ready to play.','Sonido listo para reproducir.','サウンドを再生できます。'],['Recording from microphone…','Grabando desde el micrófono…','マイクから録音中…'],['Recording… click Stop to save','Grabando… pulsa Detener para guardar','録音中…停止を押して保存'],['Use Play sound or Play on repeat in an object event to play this resource.','Usa Reproducir sonido o Reproducir en bucle en un evento de objeto.','オブジェクトのイベントで「サウンドを再生」または「繰り返し再生」を使用します。'],['Choose this image in a room\'s Backgrounds tab.','Elige esta imagen en la pestaña Fondos de una sala.','ルームの「背景」タブでこの画像を選択します。'],['Store notes or text data with your project.','Guarda notas o datos de texto con tu proyecto.','プロジェクトと一緒にメモやテキストを保存します。'],['What happens here?','¿Qué sucede aquí?','ここで起きること'],['＋ Add moment','＋ Añadir momento','＋ モーメントを追加'],['Moment:','Momento:','モーメント：'],['Note:','Nota:','メモ：'],['Minimize','Minimizar','最小化'],['Maximize','Maximizar','最大化'],['Collapse resource panel','Contraer panel de recursos','リソースパネルを折りたたむ'],['Project tools','Herramientas del proyecto','プロジェクトツール'],['Main menu','Menú principal','メインメニュー'],['Resources','Recursos','リソース'],['Editor workspace','Área de edición','編集スペース'],['Script JavaScript source','Código JavaScript del script','スクリプトの JavaScript コード']
  ];
  rows.push(
    ['GameTsukuru JS help','Ayuda de GameTsukuru JS','GameTsukuru JS ヘルプ'],['Build a game with sprites, objects, and rooms. Load an image into a sprite, assign it to an object, then place the object in a room.','Crea un juego con sprites, objetos y salas. Carga una imagen en un sprite, asígnalo a un objeto y coloca el objeto en una sala.','スプライト、オブジェクト、ルームでゲームを作ります。画像をスプライトに読み込み、オブジェクトに割り当て、ルームに配置します。'],['In an object, choose an','En un objeto, elige un','オブジェクトで'],['event','evento','イベント'],[', then click Move, Jump, React, or another action icon. Select an action to edit its settings.',', luego haz clic en Mover, Saltar, Reaccionar u otro icono de acción. Selecciona una acción para editar sus opciones.','を選び、移動、ジャンプ、反応などのアイコンをクリックします。アクションを選んで設定を編集します。'],['To use JavaScript, add a resource in the','Para usar JavaScript, añade un recurso en la carpeta','JavaScript を使うには'],['folder and place a','y coloca la acción','フォルダーにリソースを追加し'],['action in an event. Scripts receive','en un evento. Los scripts reciben','アクションをイベントに配置します。スクリプトには'],['opens the frame editor. Double-click a frame to paint it in the Image Editor.','abre el editor de fotogramas. Haz doble clic en uno para pintar en el editor de imágenes.','を押すとフレームエディターが開きます。フレームをダブルクリックして画像エディターで描画します。'],['The Path editor lets you add and drag points, choose straight or smooth connections, and set the end action. Use Follow path in an object’s Create event.','El editor de rutas permite añadir y mover puntos, elegir líneas rectas o curvas y configurar la acción final. Usa Seguir ruta en el evento Crear de un objeto.','パスエディターでは点の追加と移動、直線や曲線の選択、終点での動作を設定できます。オブジェクトの作成イベントで「パスをたどる」を使います。'],['For a scrolling room, enlarge it in','Para que la sala se desplace, amplíala en','スクロールするルームにするには'],[', then use',', luego usa','、次に'],['to enable a smaller view and choose the object to follow.','para activar una vista más pequeña y elegir el objeto que se seguirá.','で小さいビューを有効にし、追跡するオブジェクトを選びます。'],['The Sound window can load a file or record from your microphone.','La ventana Sonido puede cargar un archivo o grabar desde el micrófono.','サウンドウィンドウではファイルの読み込みやマイク録音ができます。'],['runs the selected room. File → Export JSON saves the editable project; File → Export playable HTML creates a standalone game.','ejecuta la sala seleccionada. Archivo → Exportar JSON guarda el proyecto editable; Exportar HTML jugable crea un juego independiente.','で選択したルームを実行します。ファイル → JSON を書き出すで編集可能なプロジェクトを保存し、プレイ用 HTML を書き出すで単体のゲームを作成します。'],
    ['Move in direction','Mover en una dirección','指定方向に移動'],['Move toward point','Mover hacia un punto','点に向かって移動'],['Follow path','Seguir ruta','パスをたどる'],['End path','Terminar ruta','パスを終了'],['Set horizontal speed','Definir velocidad horizontal','水平速度を設定'],['Set vertical speed','Definir velocidad vertical','垂直速度を設定'],['Stop moving','Detener movimiento','移動を停止'],['Reverse horizontal','Invertir horizontal','水平方向を反転'],['Reverse vertical','Invertir vertical','垂直方向を反転'],['Jump to position','Saltar a posición','指定位置にジャンプ'],['Jump relative','Saltar relativamente','相対ジャンプ'],['Jump to random place','Saltar a lugar aleatorio','ランダムな位置にジャンプ'],['Jump to start','Saltar al inicio','開始位置にジャンプ'],['Bounce on collision','Rebotar al colisionar','衝突時に跳ね返る'],['Destroy instance','Destruir instancia','インスタンスを破棄'],['Destroy other','Destruir el otro','相手を破棄'],['Create instance','Crear instancia','インスタンスを作成'],['Change sprite','Cambiar sprite','スプライトを変更'],['Face horizontal movement','Orientar según el movimiento horizontal','水平方向に向きを合わせる'],['Directional grid sprites','Sprites de cuadrícula direccionales','方向別グリッドスプライト'],['Up walking sprite','Sprite caminando arriba','上歩きスプライト'],['Up stopped sprite','Sprite detenido arriba','上停止スプライト'],['Down walking sprite','Sprite caminando abajo','下歩きスプライト'],['Down stopped sprite','Sprite detenido abajo','下停止スプライト'],['Left walking sprite','Sprite caminando izquierda','左歩きスプライト'],['Left stopped sprite','Sprite detenido izquierda','左停止スプライト'],['Right walking sprite','Sprite caminando derecha','右歩きスプライト'],['Right stopped sprite','Sprite detenido derecha','右停止スプライト'],['Play sound','Reproducir sonido','サウンドを再生'],['Play on repeat','Reproducir en bucle','繰り返し再生'],['Stop sound','Detener sonido','サウンドを停止'],['Only if colliding with','Solo si colisiona con','衝突相手が次の場合のみ'],['(any object)','(cualquier objeto)','(任意のオブジェクト)'],['(all sounds)','(todos los sonidos)','(すべてのサウンド)'],['Volume','Volumen','音量'],['Go to room','Ir a sala','ルームへ移動'],['Choose controls','Elegir controles','操作方法を選択'],['Display touchscreen controls','Mostrar controles táctiles','タッチ操作ボタンを表示'],['A sprite','Sprite A','A スプライト'],['B sprite','Sprite B','B スプライト'],['Up sprite','Sprite arriba','上スプライト'],['Down sprite','Sprite abajo','下スプライト'],['Left sprite','Sprite izquierda','左スプライト'],['Right sprite','Sprite derecha','右スプライト'],['Set variable','Definir variable','変数を設定'],['Set score','Definir puntuación','スコアを設定'],['Add score','Sumar puntos','スコアを加算'],['Show message','Mostrar mensaje','メッセージを表示'],['Draw sprite','Dibujar sprite','スプライトを描画'],['Draw text','Dibujar texto','テキストを描画'],['Draw rectangle','Dibujar rectángulo','長方形を描画'],['Run script','Ejecutar script','スクリプトを実行'],
    ['Direction','Dirección','方向'],['Speed','Velocidad','速度'],['Relative to instance','Relativo a la instancia','インスタンスからの相対位置'],['Change X','Cambio X','X の変化'],['Change Y','Cambio Y','Y の変化'],['Grid size','Tamaño de cuadrícula','グリッドサイズ'],['Relative','Relativo','相対'],['On','En','対象'],['This instance','Esta instancia','このインスタンス'],['Game','Juego','ゲーム'],['Variable','Variable','変数'],['Value','Valor','値'],['Add to current','Sumar al valor actual','現在の値に加算'],['Points','Puntos','点数'],['Message','Mensaje','メッセージ'],['Text','Texto','テキスト'],
    ['Insert','Insertar','挿入'],['connection kind','tipo de conexión','接続の種類'],['Straight lines','Líneas rectas','直線'],['Smooth curve','Curva suave','滑らかな曲線'],['action at the end','acción al final','終点での動作'],['Reverse','Invertir','反転'],['Continue','Continuar','続行'],['Move to start','Ir al inicio','開始位置へ移動'],['Click the canvas to add a point.','Haz clic en el lienzo para añadir un punto.','キャンバスをクリックして点を追加します。'],['Click the preview to add a point. Drag points to move them.','Haz clic en la vista previa para añadir un punto. Arrástralo para moverlo.','プレビューをクリックして点を追加します。ドラッグで移動します。'],['Path points','Puntos de la ruta','パスの点'],['Zoom out','Alejar','縮小'],['Zoom in','Acercar','拡大'],['Actual size','Tamaño real','実寸'],['Fit path','Ajustar ruta','パスを合わせる'],['Fit','Ajustar','合わせる'],
    ['Transform','Transformar','変形'],['Images','Imágenes','画像'],['Animation','Animación','アニメーション'],['Done','Hecho','完了'],['New blank frame','Nuevo fotograma vacío','新しい空のフレーム'],['Load images…','Cargar imágenes…','画像を読み込む…'],['Duplicate frame','Duplicar fotograma','フレームを複製'],['Delete frame','Eliminar fotograma','フレームを削除'],['Move left','Mover a la izquierda','左へ移動'],['Move right','Mover a la derecha','右へ移動'],['Flip horizontally','Voltear horizontalmente','左右反転'],['Flip vertically','Voltear verticalmente','上下反転'],['Rotate 90°','Girar 90°','90° 回転'],['Edit image','Editar imagen','画像を編集'],['Add blank image','Añadir imagen vacía','空の画像を追加'],['Play or stop preview','Iniciar o detener vista previa','プレビューを再生・停止'],['New blank image','Nueva imagen vacía','新しい空の画像'],['Load image files','Cargar archivos de imagen','画像ファイルを読み込む'],['Move frame left','Mover fotograma a la izquierda','フレームを左へ'],['Move frame right','Mover fotograma a la derecha','フレームを右へ'],['Preview animation','Vista previa de animación','アニメーションをプレビュー'],['Show Preview','Mostrar vista previa','プレビューを表示'],['Animation preview','Vista previa de animación','アニメーションのプレビュー'],['No images yet. Use the folder button to load images, or create a blank frame.','Todavía no hay imágenes. Carga una o crea un fotograma vacío.','画像がありません。画像を読み込むか、空のフレームを作成してください。'],['Opaque','Opaco','不透明'],['Frames:','Fotogramas:','フレーム：'],['Size:','Tamaño:','サイズ：']
  );
  const translations = {es:new Map(rows.map(([en,es])=>[en,es])),ja:new Map(rows.map(([en,,ja])=>[en,ja]))};
  const originals = new WeakMap();
  const attrOriginals = new WeakMap();
  let current = 'en';
  const overlay = document.getElementById('languageOverlay');

  function translate(source) {
    if (current === 'en') return source;
    const trimmed = source.trim();
    const replacement = translations[current].get(trimmed);
    if (replacement) return source.replace(trimmed, replacement);
    const title = trimmed.match(/^(Sprite|Sound|Background|Path|Script|Timeline|Object|Room|Data File) Properties — (.+)$/);
    if (title) return source.replace(trimmed, `${translations[current].get(title[1]) || title[1]} ${current === 'es' ? 'Propiedades' : 'プロパティ'} — ${title[2]}`);
    const actions = trimmed.match(/^Actions · (.+)$/);
    if (actions) return source.replace(trimmed, `${translations[current].get('Actions ·')} ${translations[current].get(actions[1]) || actions[1]}`);
    const spriteEditor = trimmed.match(/^(Sprite Editor|Image Editor) — (.+)$/);
    if (spriteEditor) return source.replace(trimmed, `${current === 'es' ? (spriteEditor[1] === 'Sprite Editor' ? 'Editor de sprites' : 'Editor de imágenes') : (spriteEditor[1] === 'Sprite Editor' ? 'スプライトエディター' : '画像エディター')} — ${spriteEditor[2]}`);
    const numbers = trimmed.match(/^(Frames|Size|Number of subimages|Width|Height): (.+)$/);
    if (numbers) {
      const labels = {Frames:['Fotogramas','フレーム'],Size:['Tamaño','サイズ'],'Number of subimages':['Número de subimágenes','サブ画像の数'],Width:['Ancho','幅'],Height:['Alto','高さ']};
      return source.replace(trimmed, `${labels[numbers[1]][current === 'es' ? 0 : 1]}: ${numbers[2]}`);
    }
    return source;
  }

  function updateText(node) {
    if (node.parentElement?.closest('#languageOverlay, textarea, pre, code, .tree-item, .room-instance, .js-editor-surface')) return;
    let saved = originals.get(node);
    if (!saved || node.nodeValue !== saved.last) saved = {source:node.nodeValue,last:node.nodeValue};
    const result = translate(saved.source);
    if (node.nodeValue !== result) node.nodeValue = result;
    saved.last = result;
    originals.set(node, saved);
  }

  function updateElement(element) {
    if (element.closest('#languageOverlay')) return;
    const saved = attrOriginals.get(element) || {};
    for (const attr of ['title','aria-label','placeholder']) {
      const value = element.getAttribute(attr);
      if (value === null) continue;
      if (!saved[attr] || value !== saved[attr].last) saved[attr] = {source:value,last:value};
      const result = translate(saved[attr].source);
      if (value !== result) element.setAttribute(attr,result);
      saved[attr].last = result;
    }
    attrOriginals.set(element,saved);
  }

  function updateTree(root = document.body) {
    if (root.nodeType === Node.TEXT_NODE) { updateText(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    updateElement(root);
    const walker = document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) walker.currentNode.nodeType === Node.TEXT_NODE ? updateText(walker.currentNode) : updateElement(walker.currentNode);
  }

  function setLanguage(language) {
    current = language;
    document.documentElement.lang = language;
    try { localStorage.setItem(KEY,language); } catch {}
    overlay.hidden = true;
    document.getElementById('app').inert = false;
    updateTree();
  }

  overlay.addEventListener('click', event => {
    const button = event.target.closest('[data-language]');
    if (button) setLanguage(button.dataset.language);
  });
  document.getElementById('changeLanguage').addEventListener('click', () => { overlay.hidden = false; document.getElementById('app').inert = true; overlay.querySelector('button').focus(); });
  document.addEventListener('keydown', event => {
    if (overlay.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); }
    if (event.key === 'Tab') {
      const buttons = [...overlay.querySelectorAll('button')];
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  },true);
  new MutationObserver(records => {
    if (current === 'en') return;
    for (const record of records) {
      if (record.type === 'characterData') updateText(record.target);
      else if (record.type === 'attributes') updateElement(record.target);
      else record.addedNodes.forEach(updateTree);
    }
  }).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder']});
  let saved;
  try { saved = localStorage.getItem(KEY); } catch {}
  if (['en','es','ja'].includes(saved)) setLanguage(saved);
  else { overlay.hidden = false; document.getElementById('app').inert = true; overlay.querySelector('button').focus(); }
})();

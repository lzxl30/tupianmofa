// ==================== 插件清单 ====================
// 每增加一个新玩法，只需在这里添加一个对象，
// 然后在 plugins/ 目录下新建对应的 JS 文件即可。
// 无需修改 index.html 或其他文件。
const PLUGIN_LIST = [
  {
    id: 'phantom-tank',
    name: '幻影坦克',
    icon: '🎭',
    script: 'plugins/phantom-tank.js',
    badge: ''
  },
  {
    id: 'lsb-stego',
    name: 'LSB隐写术',
    icon: '🔐',
    script: 'plugins/lsb-stego.js',
    badge: ''
  }
  // 示例：未来添加新玩法
  // {
  //   id: 'ascii-art',
  //   name: 'ASCII 艺术',
  //   icon: '📝',
  //   script: 'plugins/ascii-art.js',
  //   badge: '新'
  // }
];

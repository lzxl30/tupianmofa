// 插件清单：每添加一个新玩法，只需在此追加一个对象，并创建对应的插件JS文件
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
  // 未来添加示例：
  // {
  //   id: 'ascii-art',
  //   name: 'ASCII 艺术',
  //   icon: '📝',
  //   script: 'plugins/ascii-art.js',
  //   badge: '新'
  // }
];

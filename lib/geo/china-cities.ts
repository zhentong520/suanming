/** 中国地级市/直辖市/特别行政区市中心经纬度（用于真太阳时近似） */

export type ChinaCity = {
  name: string;
  province: string;
  lon: number;
  lat: number;
};

export const CHINA_CITIES: ChinaCity[] = [
  // 直辖市
  { name: "北京", province: "北京", lon: 116.41, lat: 39.9 },
  { name: "天津", province: "天津", lon: 117.2, lat: 39.13 },
  { name: "上海", province: "上海", lon: 121.47, lat: 31.23 },
  { name: "重庆", province: "重庆", lon: 106.55, lat: 29.56 },

  // 河北
  { name: "石家庄", province: "河北", lon: 114.51, lat: 38.04 },
  { name: "唐山", province: "河北", lon: 118.18, lat: 39.63 },
  { name: "秦皇岛", province: "河北", lon: 119.6, lat: 39.94 },
  { name: "邯郸", province: "河北", lon: 114.49, lat: 36.61 },
  { name: "邢台", province: "河北", lon: 114.5, lat: 37.07 },
  { name: "保定", province: "河北", lon: 115.46, lat: 38.87 },
  { name: "张家口", province: "河北", lon: 114.88, lat: 40.81 },
  { name: "承德", province: "河北", lon: 117.96, lat: 40.95 },
  { name: "沧州", province: "河北", lon: 116.86, lat: 38.3 },
  { name: "廊坊", province: "河北", lon: 116.7, lat: 39.52 },
  { name: "衡水", province: "河北", lon: 115.67, lat: 37.74 },

  // 山西
  { name: "太原", province: "山西", lon: 112.55, lat: 37.87 },
  { name: "大同", province: "山西", lon: 113.3, lat: 40.08 },
  { name: "阳泉", province: "山西", lon: 113.58, lat: 37.86 },
  { name: "长治", province: "山西", lon: 113.12, lat: 36.2 },
  { name: "晋城", province: "山西", lon: 112.85, lat: 35.5 },
  { name: "朔州", province: "山西", lon: 112.43, lat: 39.33 },
  { name: "晋中", province: "山西", lon: 112.75, lat: 37.69 },
  { name: "运城", province: "山西", lon: 111.01, lat: 35.03 },
  { name: "忻州", province: "山西", lon: 112.73, lat: 38.42 },
  { name: "临汾", province: "山西", lon: 111.52, lat: 36.09 },
  { name: "吕梁", province: "山西", lon: 111.14, lat: 37.52 },

  // 内蒙古
  { name: "呼和浩特", province: "内蒙古", lon: 111.75, lat: 40.84 },
  { name: "包头", province: "内蒙古", lon: 109.84, lat: 40.66 },
  { name: "乌海", province: "内蒙古", lon: 106.83, lat: 39.67 },
  { name: "赤峰", province: "内蒙古", lon: 118.89, lat: 42.26 },
  { name: "通辽", province: "内蒙古", lon: 122.26, lat: 43.65 },
  { name: "鄂尔多斯", province: "内蒙古", lon: 109.99, lat: 39.82 },
  { name: "呼伦贝尔", province: "内蒙古", lon: 119.77, lat: 49.22 },
  { name: "巴彦淖尔", province: "内蒙古", lon: 107.39, lat: 40.74 },
  { name: "乌兰察布", province: "内蒙古", lon: 113.11, lat: 41.0 },
  { name: "兴安盟", province: "内蒙古", lon: 122.07, lat: 46.08 },
  { name: "锡林郭勒盟", province: "内蒙古", lon: 116.09, lat: 43.94 },
  { name: "阿拉善盟", province: "内蒙古", lon: 105.71, lat: 38.84 },

  // 辽宁
  { name: "沈阳", province: "辽宁", lon: 123.43, lat: 41.8 },
  { name: "大连", province: "辽宁", lon: 121.61, lat: 38.91 },
  { name: "鞍山", province: "辽宁", lon: 122.99, lat: 41.11 },
  { name: "抚顺", province: "辽宁", lon: 123.92, lat: 41.88 },
  { name: "本溪", province: "辽宁", lon: 123.77, lat: 41.3 },
  { name: "丹东", province: "辽宁", lon: 124.38, lat: 40.12 },
  { name: "锦州", province: "辽宁", lon: 121.14, lat: 41.1 },
  { name: "营口", province: "辽宁", lon: 122.23, lat: 40.67 },
  { name: "阜新", province: "辽宁", lon: 121.65, lat: 42.02 },
  { name: "辽阳", province: "辽宁", lon: 123.17, lat: 41.27 },
  { name: "盘锦", province: "辽宁", lon: 122.07, lat: 41.12 },
  { name: "铁岭", province: "辽宁", lon: 123.84, lat: 42.29 },
  { name: "朝阳", province: "辽宁", lon: 120.45, lat: 41.57 },
  { name: "葫芦岛", province: "辽宁", lon: 120.84, lat: 40.71 },

  // 吉林
  { name: "长春", province: "吉林", lon: 125.32, lat: 43.82 },
  { name: "吉林市", province: "吉林", lon: 126.55, lat: 43.84 },
  { name: "四平", province: "吉林", lon: 124.37, lat: 43.17 },
  { name: "辽源", province: "吉林", lon: 125.14, lat: 42.89 },
  { name: "通化", province: "吉林", lon: 125.94, lat: 41.73 },
  { name: "白山", province: "吉林", lon: 126.43, lat: 41.94 },
  { name: "松原", province: "吉林", lon: 124.82, lat: 45.14 },
  { name: "白城", province: "吉林", lon: 122.84, lat: 45.62 },
  { name: "延边", province: "吉林", lon: 129.51, lat: 42.91 },

  // 黑龙江
  { name: "哈尔滨", province: "黑龙江", lon: 126.53, lat: 45.8 },
  { name: "齐齐哈尔", province: "黑龙江", lon: 123.92, lat: 47.35 },
  { name: "鸡西", province: "黑龙江", lon: 130.98, lat: 45.3 },
  { name: "鹤岗", province: "黑龙江", lon: 130.28, lat: 47.33 },
  { name: "双鸭山", province: "黑龙江", lon: 131.16, lat: 46.65 },
  { name: "大庆", province: "黑龙江", lon: 125.1, lat: 46.59 },
  { name: "伊春", province: "黑龙江", lon: 128.9, lat: 47.73 },
  { name: "佳木斯", province: "黑龙江", lon: 130.32, lat: 46.81 },
  { name: "七台河", province: "黑龙江", lon: 131.02, lat: 45.77 },
  { name: "牡丹江", province: "黑龙江", lon: 129.62, lat: 44.58 },
  { name: "黑河", province: "黑龙江", lon: 127.53, lat: 50.25 },
  { name: "绥化", province: "黑龙江", lon: 126.99, lat: 46.64 },
  { name: "大兴安岭", province: "黑龙江", lon: 124.12, lat: 50.41 },

  // 江苏
  { name: "南京", province: "江苏", lon: 118.8, lat: 32.06 },
  { name: "无锡", province: "江苏", lon: 120.31, lat: 31.49 },
  { name: "徐州", province: "江苏", lon: 117.28, lat: 34.21 },
  { name: "常州", province: "江苏", lon: 119.95, lat: 31.78 },
  { name: "苏州", province: "江苏", lon: 120.62, lat: 31.3 },
  { name: "南通", province: "江苏", lon: 120.86, lat: 32.02 },
  { name: "连云港", province: "江苏", lon: 119.18, lat: 34.6 },
  { name: "淮安", province: "江苏", lon: 119.02, lat: 33.6 },
  { name: "盐城", province: "江苏", lon: 120.14, lat: 33.38 },
  { name: "扬州", province: "江苏", lon: 119.42, lat: 32.39 },
  { name: "镇江", province: "江苏", lon: 119.45, lat: 32.2 },
  { name: "泰州", province: "江苏", lon: 119.92, lat: 32.48 },
  { name: "宿迁", province: "江苏", lon: 118.28, lat: 33.96 },

  // 浙江
  { name: "杭州", province: "浙江", lon: 120.15, lat: 30.27 },
  { name: "宁波", province: "浙江", lon: 121.54, lat: 29.87 },
  { name: "温州", province: "浙江", lon: 120.7, lat: 28.0 },
  { name: "嘉兴", province: "浙江", lon: 120.75, lat: 30.76 },
  { name: "湖州", province: "浙江", lon: 120.09, lat: 30.89 },
  { name: "绍兴", province: "浙江", lon: 120.58, lat: 30.03 },
  { name: "金华", province: "浙江", lon: 119.65, lat: 29.08 },
  { name: "衢州", province: "浙江", lon: 118.87, lat: 28.94 },
  { name: "舟山", province: "浙江", lon: 122.11, lat: 30.02 },
  { name: "台州", province: "浙江", lon: 121.42, lat: 28.66 },
  { name: "丽水", province: "浙江", lon: 119.92, lat: 28.45 },

  // 安徽
  { name: "合肥", province: "安徽", lon: 117.28, lat: 31.86 },
  { name: "芜湖", province: "安徽", lon: 118.38, lat: 31.33 },
  { name: "蚌埠", province: "安徽", lon: 117.39, lat: 32.92 },
  { name: "淮南", province: "安徽", lon: 117.02, lat: 32.65 },
  { name: "马鞍山", province: "安徽", lon: 118.51, lat: 31.69 },
  { name: "淮北", province: "安徽", lon: 116.79, lat: 33.96 },
  { name: "铜陵", province: "安徽", lon: 117.81, lat: 30.93 },
  { name: "安庆", province: "安徽", lon: 117.05, lat: 30.53 },
  { name: "黄山", province: "安徽", lon: 118.34, lat: 29.71 },
  { name: "滁州", province: "安徽", lon: 118.32, lat: 32.3 },
  { name: "阜阳", province: "安徽", lon: 115.81, lat: 32.89 },
  { name: "宿州", province: "安徽", lon: 116.98, lat: 33.63 },
  { name: "六安", province: "安徽", lon: 116.51, lat: 31.75 },
  { name: "亳州", province: "安徽", lon: 115.78, lat: 33.87 },
  { name: "池州", province: "安徽", lon: 117.49, lat: 30.66 },
  { name: "宣城", province: "安徽", lon: 118.76, lat: 30.94 },

  // 福建
  { name: "福州", province: "福建", lon: 119.3, lat: 26.08 },
  { name: "厦门", province: "福建", lon: 118.09, lat: 24.48 },
  { name: "莆田", province: "福建", lon: 119.01, lat: 25.43 },
  { name: "三明", province: "福建", lon: 117.64, lat: 26.27 },
  { name: "泉州", province: "福建", lon: 118.68, lat: 24.87 },
  { name: "漳州", province: "福建", lon: 117.65, lat: 24.51 },
  { name: "南平", province: "福建", lon: 118.18, lat: 26.64 },
  { name: "龙岩", province: "福建", lon: 117.02, lat: 25.09 },
  { name: "宁德", province: "福建", lon: 119.53, lat: 26.67 },

  // 江西
  { name: "南昌", province: "江西", lon: 115.86, lat: 28.68 },
  { name: "景德镇", province: "江西", lon: 117.21, lat: 29.29 },
  { name: "萍乡", province: "江西", lon: 113.85, lat: 27.62 },
  { name: "九江", province: "江西", lon: 116.0, lat: 29.71 },
  { name: "新余", province: "江西", lon: 114.92, lat: 27.82 },
  { name: "鹰潭", province: "江西", lon: 117.03, lat: 28.24 },
  { name: "赣州", province: "江西", lon: 114.94, lat: 25.85 },
  { name: "吉安", province: "江西", lon: 114.99, lat: 27.11 },
  { name: "宜春", province: "江西", lon: 114.39, lat: 27.8 },
  { name: "抚州", province: "江西", lon: 116.36, lat: 27.98 },
  { name: "上饶", province: "江西", lon: 117.97, lat: 28.44 },

  // 山东
  { name: "济南", province: "山东", lon: 117.12, lat: 36.65 },
  { name: "青岛", province: "山东", lon: 120.38, lat: 36.07 },
  { name: "淄博", province: "山东", lon: 118.05, lat: 36.81 },
  { name: "枣庄", province: "山东", lon: 117.56, lat: 34.86 },
  { name: "东营", province: "山东", lon: 118.67, lat: 37.43 },
  { name: "烟台", province: "山东", lon: 121.45, lat: 37.46 },
  { name: "潍坊", province: "山东", lon: 119.11, lat: 36.71 },
  { name: "济宁", province: "山东", lon: 116.59, lat: 35.41 },
  { name: "泰安", province: "山东", lon: 117.09, lat: 36.2 },
  { name: "威海", province: "山东", lon: 122.12, lat: 37.51 },
  { name: "日照", province: "山东", lon: 119.53, lat: 35.42 },
  { name: "临沂", province: "山东", lon: 118.34, lat: 35.07 },
  { name: "德州", province: "山东", lon: 116.36, lat: 37.44 },
  { name: "聊城", province: "山东", lon: 115.99, lat: 36.46 },
  { name: "滨州", province: "山东", lon: 117.97, lat: 37.38 },
  { name: "菏泽", province: "山东", lon: 115.47, lat: 35.25 },

  // 河南
  { name: "郑州", province: "河南", lon: 113.63, lat: 34.75 },
  { name: "开封", province: "河南", lon: 114.31, lat: 34.8 },
  { name: "洛阳", province: "河南", lon: 112.45, lat: 34.62 },
  { name: "平顶山", province: "河南", lon: 113.19, lat: 33.77 },
  { name: "安阳", province: "河南", lon: 114.39, lat: 36.1 },
  { name: "鹤壁", province: "河南", lon: 114.3, lat: 35.75 },
  { name: "新乡", province: "河南", lon: 113.88, lat: 35.3 },
  { name: "焦作", province: "河南", lon: 113.24, lat: 35.22 },
  { name: "濮阳", province: "河南", lon: 115.03, lat: 35.76 },
  { name: "许昌", province: "河南", lon: 113.83, lat: 34.04 },
  { name: "漯河", province: "河南", lon: 114.05, lat: 33.58 },
  { name: "三门峡", province: "河南", lon: 111.19, lat: 34.78 },
  { name: "南阳", province: "河南", lon: 112.53, lat: 32.99 },
  { name: "商丘", province: "河南", lon: 115.65, lat: 34.44 },
  { name: "信阳", province: "河南", lon: 114.09, lat: 32.15 },
  { name: "周口", province: "河南", lon: 114.7, lat: 33.63 },
  { name: "驻马店", province: "河南", lon: 114.02, lat: 33.01 },
  { name: "济源", province: "河南", lon: 112.59, lat: 35.09 },

  // 湖北
  { name: "武汉", province: "湖北", lon: 114.3, lat: 30.59 },
  { name: "黄石", province: "湖北", lon: 115.04, lat: 30.2 },
  { name: "十堰", province: "湖北", lon: 110.8, lat: 32.63 },
  { name: "宜昌", province: "湖北", lon: 111.29, lat: 30.69 },
  { name: "襄阳", province: "湖北", lon: 112.14, lat: 32.04 },
  { name: "鄂州", province: "湖北", lon: 114.89, lat: 30.4 },
  { name: "荆门", province: "湖北", lon: 112.2, lat: 31.04 },
  { name: "孝感", province: "湖北", lon: 113.92, lat: 30.92 },
  { name: "荆州", province: "湖北", lon: 112.24, lat: 30.33 },
  { name: "黄冈", province: "湖北", lon: 114.88, lat: 30.45 },
  { name: "咸宁", province: "湖北", lon: 114.33, lat: 29.84 },
  { name: "随州", province: "湖北", lon: 113.37, lat: 31.72 },
  { name: "恩施", province: "湖北", lon: 109.49, lat: 30.28 },
  { name: "仙桃", province: "湖北", lon: 113.44, lat: 30.33 },
  { name: "潜江", province: "湖北", lon: 112.9, lat: 30.42 },
  { name: "天门", province: "湖北", lon: 113.17, lat: 30.65 },
  { name: "神农架", province: "湖北", lon: 110.67, lat: 31.74 },

  // 湖南
  { name: "长沙", province: "湖南", lon: 112.94, lat: 28.23 },
  { name: "株洲", province: "湖南", lon: 113.13, lat: 27.83 },
  { name: "湘潭", province: "湖南", lon: 112.94, lat: 27.83 },
  { name: "衡阳", province: "湖南", lon: 112.61, lat: 26.89 },
  { name: "邵阳", province: "湖南", lon: 111.47, lat: 27.24 },
  { name: "岳阳", province: "湖南", lon: 113.13, lat: 29.36 },
  { name: "常德", province: "湖南", lon: 111.7, lat: 29.04 },
  { name: "张家界", province: "湖南", lon: 110.48, lat: 29.13 },
  { name: "益阳", province: "湖南", lon: 112.36, lat: 28.57 },
  { name: "郴州", province: "湖南", lon: 113.03, lat: 25.79 },
  { name: "永州", province: "湖南", lon: 111.61, lat: 26.43 },
  { name: "怀化", province: "湖南", lon: 110.0, lat: 27.55 },
  { name: "娄底", province: "湖南", lon: 111.99, lat: 27.71 },
  { name: "湘西", province: "湖南", lon: 109.74, lat: 28.31 },

  // 广东
  { name: "广州", province: "广东", lon: 113.26, lat: 23.13 },
  { name: "韶关", province: "广东", lon: 113.6, lat: 24.81 },
  { name: "深圳", province: "广东", lon: 114.06, lat: 22.55 },
  { name: "珠海", province: "广东", lon: 113.58, lat: 22.27 },
  { name: "汕头", province: "广东", lon: 116.68, lat: 23.35 },
  { name: "佛山", province: "广东", lon: 113.12, lat: 23.02 },
  { name: "江门", province: "广东", lon: 113.09, lat: 22.59 },
  { name: "湛江", province: "广东", lon: 110.36, lat: 21.27 },
  { name: "茂名", province: "广东", lon: 110.93, lat: 21.66 },
  { name: "肇庆", province: "广东", lon: 112.47, lat: 23.05 },
  { name: "惠州", province: "广东", lon: 114.42, lat: 23.11 },
  { name: "梅州", province: "广东", lon: 116.12, lat: 24.29 },
  { name: "汕尾", province: "广东", lon: 115.36, lat: 22.79 },
  { name: "河源", province: "广东", lon: 114.7, lat: 23.75 },
  { name: "阳江", province: "广东", lon: 111.98, lat: 21.86 },
  { name: "清远", province: "广东", lon: 113.06, lat: 23.68 },
  { name: "东莞", province: "广东", lon: 113.75, lat: 23.02 },
  { name: "中山", province: "广东", lon: 113.39, lat: 22.52 },
  { name: "潮州", province: "广东", lon: 116.62, lat: 23.66 },
  { name: "揭阳", province: "广东", lon: 116.37, lat: 23.55 },
  { name: "云浮", province: "广东", lon: 112.04, lat: 22.93 },

  // 广西
  { name: "南宁", province: "广西", lon: 108.32, lat: 22.82 },
  { name: "柳州", province: "广西", lon: 109.41, lat: 24.31 },
  { name: "桂林", province: "广西", lon: 110.29, lat: 25.27 },
  { name: "梧州", province: "广西", lon: 111.28, lat: 23.48 },
  { name: "北海", province: "广西", lon: 109.12, lat: 21.47 },
  { name: "防城港", province: "广西", lon: 108.35, lat: 21.69 },
  { name: "钦州", province: "广西", lon: 108.62, lat: 21.97 },
  { name: "贵港", province: "广西", lon: 109.6, lat: 23.09 },
  { name: "玉林", province: "广西", lon: 110.15, lat: 22.63 },
  { name: "百色", province: "广西", lon: 106.62, lat: 23.9 },
  { name: "贺州", province: "广西", lon: 111.55, lat: 24.41 },
  { name: "河池", province: "广西", lon: 108.06, lat: 24.7 },
  { name: "来宾", province: "广西", lon: 109.23, lat: 23.73 },
  { name: "崇左", province: "广西", lon: 107.36, lat: 22.4 },

  // 海南
  { name: "海口", province: "海南", lon: 110.32, lat: 20.04 },
  { name: "三亚", province: "海南", lon: 109.51, lat: 18.25 },
  { name: "三沙", province: "海南", lon: 112.35, lat: 16.83 },
  { name: "儋州", province: "海南", lon: 109.58, lat: 19.52 },

  // 四川
  { name: "成都", province: "四川", lon: 104.07, lat: 30.57 },
  { name: "自贡", province: "四川", lon: 104.78, lat: 29.35 },
  { name: "攀枝花", province: "四川", lon: 101.72, lat: 26.58 },
  { name: "泸州", province: "四川", lon: 105.44, lat: 28.87 },
  { name: "德阳", province: "四川", lon: 104.4, lat: 31.13 },
  { name: "绵阳", province: "四川", lon: 104.74, lat: 31.46 },
  { name: "广元", province: "四川", lon: 105.83, lat: 32.44 },
  { name: "遂宁", province: "四川", lon: 105.57, lat: 30.51 },
  { name: "内江", province: "四川", lon: 105.07, lat: 29.58 },
  { name: "乐山", province: "四川", lon: 103.77, lat: 29.55 },
  { name: "南充", province: "四川", lon: 106.11, lat: 30.8 },
  { name: "眉山", province: "四川", lon: 103.85, lat: 30.08 },
  { name: "宜宾", province: "四川", lon: 104.64, lat: 28.75 },
  { name: "广安", province: "四川", lon: 106.63, lat: 30.46 },
  { name: "达州", province: "四川", lon: 107.5, lat: 31.21 },
  { name: "雅安", province: "四川", lon: 103.01, lat: 29.98 },
  { name: "巴中", province: "四川", lon: 106.75, lat: 31.86 },
  { name: "资阳", province: "四川", lon: 104.64, lat: 30.12 },
  { name: "阿坝", province: "四川", lon: 102.22, lat: 31.9 },
  { name: "甘孜", province: "四川", lon: 101.96, lat: 30.05 },
  { name: "凉山", province: "四川", lon: 102.26, lat: 27.89 },

  // 贵州
  { name: "贵阳", province: "贵州", lon: 106.63, lat: 26.65 },
  { name: "六盘水", province: "贵州", lon: 104.85, lat: 26.58 },
  { name: "遵义", province: "贵州", lon: 106.93, lat: 27.73 },
  { name: "安顺", province: "贵州", lon: 105.93, lat: 26.25 },
  { name: "毕节", province: "贵州", lon: 105.29, lat: 27.28 },
  { name: "铜仁", province: "贵州", lon: 109.19, lat: 27.72 },
  { name: "黔西南", province: "贵州", lon: 104.91, lat: 25.09 },
  { name: "黔东南", province: "贵州", lon: 107.98, lat: 26.58 },
  { name: "黔南", province: "贵州", lon: 107.52, lat: 26.26 },

  // 云南
  { name: "昆明", province: "云南", lon: 102.71, lat: 25.04 },
  { name: "曲靖", province: "云南", lon: 103.8, lat: 25.5 },
  { name: "玉溪", province: "云南", lon: 102.54, lat: 24.35 },
  { name: "保山", province: "云南", lon: 99.17, lat: 25.11 },
  { name: "昭通", province: "云南", lon: 103.72, lat: 27.34 },
  { name: "丽江", province: "云南", lon: 100.23, lat: 26.87 },
  { name: "普洱", province: "云南", lon: 100.97, lat: 22.78 },
  { name: "临沧", province: "云南", lon: 100.09, lat: 23.89 },
  { name: "楚雄", province: "云南", lon: 101.55, lat: 25.04 },
  { name: "红河", province: "云南", lon: 103.38, lat: 23.37 },
  { name: "文山", province: "云南", lon: 104.24, lat: 23.37 },
  { name: "西双版纳", province: "云南", lon: 100.8, lat: 22.01 },
  { name: "大理", province: "云南", lon: 100.24, lat: 25.61 },
  { name: "德宏", province: "云南", lon: 98.58, lat: 24.44 },
  { name: "怒江", province: "云南", lon: 98.85, lat: 25.85 },
  { name: "迪庆", province: "云南", lon: 99.7, lat: 27.83 },

  // 西藏
  { name: "拉萨", province: "西藏", lon: 91.11, lat: 29.65 },
  { name: "日喀则", province: "西藏", lon: 88.88, lat: 29.27 },
  { name: "昌都", province: "西藏", lon: 97.18, lat: 31.14 },
  { name: "林芝", province: "西藏", lon: 94.36, lat: 29.65 },
  { name: "山南", province: "西藏", lon: 91.77, lat: 29.24 },
  { name: "那曲", province: "西藏", lon: 92.05, lat: 31.48 },
  { name: "阿里", province: "西藏", lon: 80.11, lat: 32.5 },

  // 陕西
  { name: "西安", province: "陕西", lon: 108.94, lat: 34.34 },
  { name: "铜川", province: "陕西", lon: 108.98, lat: 34.9 },
  { name: "宝鸡", province: "陕西", lon: 107.24, lat: 34.36 },
  { name: "咸阳", province: "陕西", lon: 108.71, lat: 34.33 },
  { name: "渭南", province: "陕西", lon: 109.5, lat: 34.5 },
  { name: "延安", province: "陕西", lon: 109.49, lat: 36.6 },
  { name: "汉中", province: "陕西", lon: 107.03, lat: 33.07 },
  { name: "榆林", province: "陕西", lon: 109.73, lat: 38.29 },
  { name: "安康", province: "陕西", lon: 109.03, lat: 32.69 },
  { name: "商洛", province: "陕西", lon: 109.94, lat: 33.87 },

  // 甘肃
  { name: "兰州", province: "甘肃", lon: 103.83, lat: 36.06 },
  { name: "嘉峪关", province: "甘肃", lon: 98.28, lat: 39.79 },
  { name: "金昌", province: "甘肃", lon: 102.19, lat: 38.52 },
  { name: "白银", province: "甘肃", lon: 104.17, lat: 36.55 },
  { name: "天水", province: "甘肃", lon: 105.72, lat: 34.58 },
  { name: "武威", province: "甘肃", lon: 102.64, lat: 37.93 },
  { name: "张掖", province: "甘肃", lon: 100.46, lat: 38.93 },
  { name: "平凉", province: "甘肃", lon: 106.68, lat: 35.54 },
  { name: "酒泉", province: "甘肃", lon: 98.51, lat: 39.74 },
  { name: "庆阳", province: "甘肃", lon: 107.64, lat: 35.73 },
  { name: "定西", province: "甘肃", lon: 104.63, lat: 35.58 },
  { name: "陇南", province: "甘肃", lon: 104.92, lat: 33.39 },
  { name: "临夏", province: "甘肃", lon: 103.21, lat: 35.6 },
  { name: "甘南", province: "甘肃", lon: 102.91, lat: 34.99 },

  // 青海
  { name: "西宁", province: "青海", lon: 101.78, lat: 36.62 },
  { name: "海东", province: "青海", lon: 102.1, lat: 36.5 },
  { name: "海北", province: "青海", lon: 100.9, lat: 36.96 },
  { name: "黄南", province: "青海", lon: 102.02, lat: 35.52 },
  { name: "海南州", province: "青海", lon: 100.62, lat: 36.28 },
  { name: "果洛", province: "青海", lon: 100.24, lat: 34.47 },
  { name: "玉树", province: "青海", lon: 97.01, lat: 33.0 },
  { name: "海西", province: "青海", lon: 97.37, lat: 37.37 },

  // 宁夏
  { name: "银川", province: "宁夏", lon: 106.28, lat: 38.47 },
  { name: "石嘴山", province: "宁夏", lon: 106.38, lat: 39.02 },
  { name: "吴忠", province: "宁夏", lon: 106.2, lat: 37.99 },
  { name: "固原", province: "宁夏", lon: 106.29, lat: 36.0 },
  { name: "中卫", province: "宁夏", lon: 105.19, lat: 37.51 },

  // 新疆
  { name: "乌鲁木齐", province: "新疆", lon: 87.62, lat: 43.79 },
  { name: "克拉玛依", province: "新疆", lon: 84.87, lat: 45.6 },
  { name: "吐鲁番", province: "新疆", lon: 89.19, lat: 42.95 },
  { name: "哈密", province: "新疆", lon: 93.51, lat: 42.83 },
  { name: "昌吉", province: "新疆", lon: 87.3, lat: 44.01 },
  { name: "博尔塔拉", province: "新疆", lon: 82.07, lat: 44.91 },
  { name: "巴音郭楞", province: "新疆", lon: 86.15, lat: 41.76 },
  { name: "阿克苏", province: "新疆", lon: 80.26, lat: 41.17 },
  { name: "克孜勒苏", province: "新疆", lon: 76.17, lat: 39.71 },
  { name: "喀什", province: "新疆", lon: 75.99, lat: 39.47 },
  { name: "和田", province: "新疆", lon: 79.93, lat: 37.11 },
  { name: "伊犁", province: "新疆", lon: 81.32, lat: 43.92 },
  { name: "塔城", province: "新疆", lon: 82.99, lat: 46.75 },
  { name: "阿勒泰", province: "新疆", lon: 88.14, lat: 47.85 },
  { name: "石河子", province: "新疆", lon: 86.04, lat: 44.31 },
  { name: "阿拉尔", province: "新疆", lon: 81.29, lat: 40.54 },
  { name: "图木舒克", province: "新疆", lon: 79.08, lat: 39.87 },
  { name: "五家渠", province: "新疆", lon: 87.54, lat: 44.17 },
  { name: "北屯", province: "新疆", lon: 87.83, lat: 47.35 },
  { name: "铁门关", province: "新疆", lon: 85.5, lat: 41.83 },
  { name: "双河", province: "新疆", lon: 82.35, lat: 44.84 },
  { name: "可克达拉", province: "新疆", lon: 80.64, lat: 43.94 },
  { name: "昆玉", province: "新疆", lon: 79.29, lat: 37.21 },
  { name: "胡杨河", province: "新疆", lon: 84.83, lat: 44.69 },

  // 港澳台（常用）
  { name: "香港", province: "香港", lon: 114.17, lat: 22.32 },
  { name: "澳门", province: "澳门", lon: 113.54, lat: 22.2 },
  { name: "台北", province: "台湾", lon: 121.56, lat: 25.04 },
  { name: "高雄", province: "台湾", lon: 120.31, lat: 22.62 },
  { name: "台中", province: "台湾", lon: 120.67, lat: 24.15 },
  { name: "台南", province: "台湾", lon: 120.21, lat: 22.99 },
];

export function cityLabel(city: ChinaCity): string {
  if (city.province === city.name) return city.name;
  return `${city.province} · ${city.name}`;
}

export function searchCities(query: string, limit = 40): ChinaCity[] {
  const q = query.trim().toLowerCase();
  if (!q) return CHINA_CITIES.slice(0, limit);
  const scored: { city: ChinaCity; score: number }[] = [];
  for (const city of CHINA_CITIES) {
    const name = city.name.toLowerCase();
    const province = city.province.toLowerCase();
    const full = `${province}${name}`;
    let score = 0;
    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (name.includes(q)) score = 60;
    else if (province.startsWith(q)) score = 50;
    else if (province.includes(q)) score = 40;
    else if (full.includes(q)) score = 30;
    if (score > 0) scored.push({ city, score });
  }
  scored.sort((a, b) => b.score - a.score || a.city.name.localeCompare(b.city.name, "zh"));
  return scored.slice(0, limit).map((s) => s.city);
}

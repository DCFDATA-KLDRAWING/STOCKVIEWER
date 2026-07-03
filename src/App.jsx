import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// === Firebase 初始化設定 ===
let app, auth, db, appId;
try {
  const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
} catch (e) {
  console.error("Firebase init error", e);
}

// === 股票清單 (完整載入 1700+ 檔) ===
const RAW_STOCK_LIST = `1101  台泥
1101B 台泥乙特
1102  亞泥
1103  嘉泥
1104  環泥
1108  幸福
1109  信大
1110  東泥
1201  味全
1203  味王
1210  大成
1213  大飲
1215  卜蜂
1216  統一
1217  愛之味
1218  泰山
1219  福壽
1220  台榮
1225  福懋油
1227  佳格
1229  聯華
1231  聯華食
1232  大統益
1233  天仁
1234  黑松
1235  興泰
1236  宏亞
1240  茂生農經
1256  鮮活果汁-KY
1259  安心
1264  德麥
1268  漢來美食
1294  漢田生技
1295  生合
1301  台塑
1303  南亞
1304  台聚
1305  華夏
1307  三芳
1308  亞聚
1309  台達化
1310  台苯
1312  國喬
1312A 國喬特
1313  聯成
1314  中石化
1315  達新
1316  上曜
1319  東陽
1321  大洋
1323  永裕
1324  地球
1325  恆大
1326  台化
1336  台翰
1337  再生-KY
1338  廣華-KY
1339  昭輝
1340  勝悅-KY
1341  富林-KY
1342  八貫
1402  遠東新
1409  新纖
1410  南染
1413  宏洲
1414  東和
1416  廣豐
1417  嘉裕
1418  東華
1419  新紡
1423  利華
1432  大魯閣
1434  福懋
1435  中福
1436  華友聯
1437  勤益控
1438  三地開發
1439  雋揚
1440  南紡
1441  大東
1442  名軒
1443  立益物流
1444  力麗
1445  大宇
1446  宏和
1447  力鵬
1449  佳和
1451  年興
1452  宏益
1453  大將
1454  台富
1455  集盛
1456  怡華
1457  宜進
1459  聯發
1460  宏遠
1463  強盛新
1464  得力
1465  偉全
1466  聚隆
1467  南緯
1468  昶和
1470  大統新創
1471  首利
1472  三洋實業
1473  台南
1474  弘裕
1475  業旺
1476  儒鴻
1477  聚陽
1503  士電
1504  東元
1506  正道
1512  瑞利
1513  中興電
1514  亞力
1515  力山
1516  川飛
1517  利奇
1519  華城
1521  大億
1522  堤維西
1522A 堤維西甲特
1524  耿鼎
1525  江申
1526  日馳
1527  鑽全
1528  恩德
1529  樂事綠能
1530  亞崴
1531  高林股
1532  勤美
1533  車王電
1535  中宇
1536  和大
1537  廣隆
1538  正峰
1539  巨庭
1540  喬福
1541  錩泰
1558  伸興
1560  中砂
1563  巧新
1565  精華
1568  倉佑
1569  濱川
1570  力肯
1580  新麥
1582  信錦
1583  程泰
1584  精剛
1586  和勤
1587  吉茂
1589  永冠-KY
1590  亞德客-KY
1591  駿吉-KY
1593  祺驊
1595  川寶
1597  直得
1598  岱宇
1599  宏佳騰
1603  華電
1604  聲寶
1605  華新
1608  華榮
1609  大亞
1611  中電
1612  宏泰
1614  三洋電
1615  大山
1616  億泰
1617  榮星
1618  合機
1623  大東電
1626  艾美特-KY
1702  南僑
1707  葡萄王
1708  東鹼
1709  和益
1710  東聯
1711  永光
1712  興農
1713  國化
1714  和桐
1717  長興
1718  中纖
1720  生達
1721  三晃
1722  台肥
1723  中碳
1725  元禎
1726  永記
1727  中華化
1730  花仙子
1731  美吾華
1732  毛寶
1733  五鼎
1734  杏輝
1735  日勝化
1736  喬山
1737  臺鹽
1742  台蠟
1752  南光
1760  寶齡富錦
1762  中化生
1773  勝一
1776  展宇
1777  生泰
1781  合世
1783  和康生
1784  訊聯
1785  光洋科
1786  科妍
1788  杏昌
1789  神隆
1795  美時
1796  金穎生技
1799  易威
1802  台玻
1805  寶徠
1806  冠軍
1808  潤隆
1809  中釉
1810  和成
1813  寶利徠
1815  富喬
1817  凱撒衛
1903  士紙
1904  正隆
1905  華紙
1906  寶隆
1907  永豐餘
1909  榮成
2002  中鋼
2002A 中鋼特
2006  東和鋼鐵
2007  烨興
2008  高興昌
2009  第一銅
2010  春源
2012  春雨
2013  中鋼構
2014  中鴻
2015  豐興
2017  官田鋼
2020  美亞
2022  聚亨
2023  燁輝
2024  志聯
2025  千興
2027  大成鋼
2028  威致
2029  盛餘
2030  彰源
2031  新光鋼
2032  新鋼
2033  佳大
2034  允強
2035  唐榮
2038  海光
2049  上銀
2059  川湖
2061  風青
2062  橋椿
2063  世鎧
2064  晉椿
2065  世豐
2066  世德
2067  嘉鋼
2069  運錩
2070  精湛
2073  雄順
2101  南港
2102  泰豐
2103  台橡
2104  國際中橡
2105  正新
2106  建大
2107  厚生
2108  南帝
2109  華豐
2114  鑫永銓
2115  六暉-KY
2201  裕隆
2204  中華
2206  三陽工業
2207  和泰車
2208  台船
2211  長榮鋼
2221  大甲
2227  裕日車
2228  劍麟
2230  泰茂
2231  為升
2233  宇隆
2235  謚源
2236  百達-KY
2239  英利-KY
2241  艾姆勒
2243  宏旭-KY
2247  汎德永業
2248  華勝-KY
2250  IKKA-KY
2254  巨鎧精密-創
2258  鴻華先進-創
2301  光寶科
2302  麗正
2303  聯電
2305  全友
2308  台達電
2312  金寶
2313  華通
2314  台揚
2316  楠梓電
2317  鴻海
2321  東訊
2323  中環
2324  仁寶
2327  國巨*
2328  廣宇
2329  華泰
2330  台積電
2331  精英
2332  友訊
2337  旺宏
2338  光罩
2340  台亞
2342  茂矽
2344  華邦電
2345  智邦
2347  聯強
2348  海悅
2348A 海悅甲特
2349  錸德
2351  順德
2352  佳世達
2353  宏碁
2354  鴻準
2355  敬鵬
2356  英業達
2357  華碩
2359  所羅門
2360  致茂
2362  藍天
2363  矽統
2364  倫飛
2365  昆盈
2367  燿華
2368  金像電
2369  菱生
2371  大同
2373  震旦行
2374  佳能
2375  凱美
2376  技嘉
2377  微星
2379  瑞昱
2380  虹光
2382  廣達
2383  台光電
2385  群光
2387  精元
2388  威盛
2390  云辰
2392  正崴
2393  億光
2395  研華
2397  友通
2399  映泰
2401  凌陽
2402  毅嘉
2404  漢唐
2405  輔信
2406  國碩
2408  南亞科
2409  友達
2412  中華電
2413  環科
2414  精技
2415  錩新
2417  圓剛
2419  仲琦
2420  新巨
2421  建準
2423  固緯
2424  陇華
2425  承啟
2426  鼎元
2427  三商電
2428  興勤
2429  銘旺科
2430  灿坤
2431  聯昌
2432  倚天酷碁-創
2433  互盛電
2434  統懋
2436  偉詮電
2438  翔耀
2439  美律
2440  太空梭
2441  超豐
2442  新美齊
2444  兆勁
2449  京元電子
2450  神腦
2451  創見
2453  凌群
2454  聯發科
2455  全新
2457  飛宏
2458  義隆
2459  敦吉
2460  建通
2461  光群雷
2462  良得電
2464  盟立
2465  麗臺
2466  冠西電
2467  志聖
2468  華經
2471  資通
2472  立隆電
2474  可成
2476  鉅祥
2477  美隆電
2478  大毅
2480  敦陽科
2481  強茂
2482  連宇
2483  百容
2484  希華
2485  兆赫
2486  一詮
2488  漢平
2489  瑞軒
2491  吉祥全
2492  華新科
2493  揚博
2495  普安
2496  卓越
2497  怡利電
2498  宏達電
2501  國建
2504  國產
2505  國揚
2506  太設
2509  全坤建
2511  太子
2514  龍邦
2515  中工
2516  新建
2520  冠德
2524  京城
2527  宏璟
2528  皇普
2530  華建
2534  宏盛
2535  達欣工
2536  宏普
2537  聯上發
2538  基泰
2539  櫻花建
2540  愛山林
2542  興富發
2543  皇昌
2545  皇翔
2546  根基
2547  日勝生
2548  華固
2596  綠意
2597  潤弘
2601  益航
2603  長榮
2605  新興
2606  裕民
2607  榮運
2608  嘉里大榮
2609  陽明
2610  華航
2611  志信
2612  中航
2613  中櫃
2614  東森
2615  萬海
2616  山隆
2617  台航
2618  長榮航
2630  亞航
2633  台灣高鐵
2634  漢翔
2636  台驊控股
2637  慧洋-KY
2640  大車隊
2641  正德
2642  宅配通
2643  捷迅
2645  長榮航太
2646  星宇航空
2701  萬企
2702  華園
2704  國宾
2705  六福
2706  第一店
2707  晶華
2712  遠雄來
2718  全心投控
2719  灿星旅
2722  夏都
2723  美食-KY
2724  藝舍-KY
2726  雅茗-KY
2727  王品
2729  瓦城
2731  雄獅
2732  六角
2734  易飛網
2736  富野
2739  寒舍
2740  天蔥
2743  山富
2745  五福
2748  雲品
2751  王座
2752  豆府
2753  八方雲集
2754  亞洲藏壽司
2755  揚秦
2756  聯發國際
2762  世界健身-KY
2801  彰銀
2812  台中銀
2816  旺旺保
2820  華票
2832  台產
2834  臺企銀
2836  高雄銀
2836A 高雄銀甲特
2838  聯邦銀
2838A 聯邦銀甲特
2845  遠東銀
2849  安泰銀
2850  新產
2851  中再保
2852  第一保
2855  統一證
2867  三商壽
2880  華南金
2881  富邦金
2881A 富邦特
2881B 富邦金乙特
2881C 富邦金丙特
2882  國泰金
2882A 國泰特
2882B 國泰金乙特
2883  凱基金
2883B 凱基金乙特
2884  玉山金
2885  元大金
2886  兆豐金
2887  台新新光金
2887E 台新新光戊特一
2887F 台新新光戊特二
2887G 台新新光庚特一
2887H 台新新光庚特二
2887I 台新新光辛特
2887Z1  台新新光己特
2889  國票金
2890  永豐金
2891  中信金
2891B 中信金乙特
2891C 中信金丙特
2892  第一金
2897  王道銀行
2897B 王道銀乙特
2901  欣欣
2903  遠百
2904  匯僑
2905  三商
2906  高林
2908  特力
2910  統領
2911  麗嬰房
2912  統一超
2913  農林
2915  潤泰全
2916  滿心
2923  鼎固-KY
2924  宏太-KY
2926  誠品生活
2929  淘帝-KY
2937  集雅社
2939  永邑-KY
2941  米斯特
2945  三商家購
2947  振宇五金
2948  寶陞
2949  欣新網
3002  歐格
3003  健和興
3004  豐達科
3005  神基
3006  晶豪科
3008  大立光
3010  華立
3011  今皓
3013  晟銘電
3014  聯陽
3015  全漢
3016  嘉晶
3017  奇鋐
3018  隆銘綠能
3019  亞光
3021  鴻名
3022  威強電
3023  信邦
3024  憶聲
3025  星通
3026  禾伸堂
3027  盛達
3028  增你強
3029  零壹
3030  德律
3031  佰鴻
3032  偉訓
3033  威健
3034  聯詠
3035  智原
3036  文曄
3037  欣興
3038  全台
3040  遠見
3041  揚智
3042  晶技
3043  科風
3044  健鼎
3045  台灣大
3046  建碁
3047  訊舟
3048  益登
3049  精金
3050  鈺德
3051  力特
3052  夆典
3054  立萬利
3055  蔚華科
3056  富華新
3057  喬鼎
3058  立德
3059  華晶科
3060  銘異
3062  建漢
3064  泰偉
3066  李洲
3067  全域
3071  協禧
3073  天方能源
3078  僑威
3081  聯亞
3083  網龍
3085  新零售
3086  華義
3088  艾訊
3090  日電貿
3092  鴻碩
3093  港建*
3094  聯傑
3095  及成
3105  穩懋
3114  好德
3115  富榮綱
3118  進階
3122  笙泉
3128  昇銳
3130  一零四
3131  弘塑
3135  凌航
3138  耀登
3141  晶宏
3147  大綜
3149  正達
3150  鈺寶-創
3152  璟德
3158  嘉實
3162  精確
3163  波若威
3164  景岳
3167  大量
3168  眾福科
3169  亞信
3171  炎洲流通
3176  基亞
3178  公準
3188  鑫龍騰
3189  景碩
3191  雲嘉南
3205  佰研
3206  志豐
3207  耀勝
3209  全科
3211  順達
3213  茂訊
3217  優群
3218  大學光
3219  倚強科
3221  台嘉碩
3224  三顧
3226  龍鋒
3227  原相
3228  金麗科
3229  晟鈦
3230  錦明
3231  緯創
3232  昱捷
3234  光環
3236  千如
3252  海灣
3257  虹冠電
3259  鑫創
3260  威剛
3264  欣銓
3265  台星科
3266  昇陽
3268  海德威
3272  東碩
3276  宇環
3284  太普高
3285  微端
3287  廣寰科
3288  點晶
3289  宜特
3290  東浦
3293  鈊象
3294  英濟
3296  勝德
3297  杭特
3303  岱稜
3305  昇貿
3306  鼎天
3308  聯德
3310  佳穎
3311  閎暉
3312  弘憶股
3313  斐成
3317  尼克森
3321  同泰
3322  建舜電
3323  加百裕
3324  雙鴻
3325  旭品
3332  幸康
3338  泰碩
3339  泰谷
3346  麗清
3349  寶德
3354  律勝
3356  奇偶
3357  臺慶科
3360  尚立
3362  先進光
3363  上詮
3372  典範
3373  熱映
3374  精材
3376  新日興
3379  彬台
3380  明泰
3388  崇越電
3390  旭軟
3402  漢科
3406  玉晶光
3413  京鼎
3416  融程電
3419  譁裕
3426  台興
3430  奇鈦科
3432  台端
3434  哲固
3437  榮創
3438  類比科
3441  聯一光
3443  創意
3444  利機
3447  展達
3450  聯鈞
3454  晶睿
3455  由田
3465  進泰電子
3466  德晉
3467  台灣精材
3479  安勤
3481  群創
3483  力致
3484  崧騰
3489  森寶
3490  單井
3491  昇達科
3492  長盛
3494  誠研
3498  陽程
3499  環天科
3501  維熹
3504  揚明光
3508  位速
3511  矽瑪
3512  皇龍
3515  華擎
3516  亞帝歐
3518  柏騰
3520  華盈
3521  台鋼建設
3522  御嵿
3523  迎輝
3526  凡甲
3527  聚積
3528  安馳
3529  力旺
3530  晶相光
3531  先益
3532  台勝科
3533  嘉澤
3535  晶彩科
3537  堡達
3540  曜越
3541  西柏
3543  州巧
3545  敦泰
3546  宇峻
3548  兆利
3550  聯穎
3551  世禾
3552  同致
3555  博士旺
3556  禾瑞亞
3557  嘉威
3558  神準
3563  牧德
3564  其陽
3567  逸昌
3570  大塚
3576  聯合再生
3577  泓格
3580  友威科
3581  博磊
3583  辛耘
3587  閎康
3588  通嘉
3591  艾笛森
3592  瑞鼎
3593  力銘
3594  磐儀
3596  智易
3597  映興
3605  宏致
3607  谷崧
3609  三一東林
3611  鼎翰
3615  安可
3617  碩天
3622  洋華
3623  富晶通
3624  光頡
3625  西勝
3628  盈正
3629  地心引力
3630  新鉅科
3631  晟楠
3632  研勤
3645  達邁
3646  艾恩特
3652  精聯
3653  健策
3661  世芯-KY
3663  鑫科
3664  安瑞-KY
3665  貿聯-KY
3666  光耀
3669  圓展
3672  康聯訊
3673  TPK-KY
3675  德微
3679  新至陞
3680  家登
3684  榮昌
3685  元創精密
3686  達能
3687  歐買尬
3689  湧德
3691  碩禾
3693  營邦
3694  海華
3701  大眾控
3702  大聯大
3703  欣陸
3704  合勤控
3705  永信
3706  神達
3707  漢磊
3708  上緯投控
3709  鑫聯大投控
3710  連展投控
3711  日月光投控
3712  永崴投控
3713  新晶投控
3714  富采
3715  定穎投控
3716  中化控股
3717  聯嘉投控
4102  永日
4104  佳醫
4105  東洋
4106  雃博
4107  邦特
4108  懷特
4109  加捷生醫
4111  濟生
4113  聯上
4114  健喬
4116  明基醫
4119  旭富
4120  友華
4121  優盛
4123  晟德
4126  太醫
4127  天良
4128  中天
4129  聯合
4130  健亞
4131  浩泰
4133  亞諾法
4137  麗豐-KY
4138  曜亞
4139  馬光-KY
4142  國光生
4147  中裕
4148  全宇生技-KY
4153  鈺緯
4154  樂威科-KY
4155  訊映
4157  太景*-KY
4160  訊聯基因
4161  聿新科
4162  智擎
4163  鐿鈦
4164  承業醫
4166  友霖
4167  松瑞藥
4168  醣聯
4171  瑞基
4173  久裕
4174  浩鼎
4175  杏一
4183  福永生技
4188  安克
4190  佐登-KY
4192  杏國
4198  欣大健康
4205  中華食
4207  環泰
4303  信立
4304  勝昱
4305  世坤
4306  炎洲
4401  東隆興
4402  郡都開發
4406  新昕纖
4413  飛寶企業
4414  如興
4416  三圓
4417  金洲
4419  皇家美食
4420  光明
4426  利勤
4430  耀億
4432  銘旺實
4433  興采
4438  廣越
4439  冠星-KY
4440  宜新實業
4441  振大環球
4442  竣邦-KY
4502  健信
4503  金雨
4506  崇友
4510  高鋒
4513  福裕
4523  永彰
4526  東台
4527  方土霖
4528  江興鍛
4529  淳紳
4530  宏易
4532  瑞智
4533  協易機
4534  慶騰
4535  至興
4536  拓凱
4538  大詠城
4540  全球傳動
4541  晟田
4542  科嶠
4543  萬在
4545  銘鈺
4549  桓達
4550  長佳
4551  智伸科
4552  力達-KY
4554  橙的
4555  氣立
4556  旭然
4557  永新-KY
4558  寶緯
4560  強信-KY
4561  健椿
4562  穎漢
4563  百德
4564  元翎
4566  時碩工業
4568  科際精密
4569  六方科-KY
4571  鈞興-KY
4572  駐龍
4576  大銀微系統
4577  達航科技
4580  捷流閥業
4581  光隆精密-KY
4583  台灣精銳
4584  君帆
4585  達明
4588  玖鼎電力
4590  富田-創
4609  唐鋒
4702  中美實
4706  大恭
4707  磐亞
4711  永純
4714  永捷
4716  大立
4720  德淵
4721  美琪瑪
4722  國精化
4726  永昕
4728  雙美
4729  熒茂
4735  豪展
4736  泰博
4737  華廣
4739  康普
4741  泓瀚
4743  合一
4744  皇將
4745  合富-KY
4746  台耀
4747  強生
4749  新應材
4754  國碳科
4755  三福化
4760  勤凱
4763  材料*-KY
4764  雙鍵
4766  南寶
4767  誠泰科技
4768  晶呈科技
4770  上品
4771  望隼
4772  台特化
4804  大略-KY
4806  桂田文創
4807  日成-KY
4903  聯光通
4904  遠傳
4905  台聯電
4906  正文
4907  富宇
4908  前鼎
4909  新復興
4911  德英
4912  聯德控股-KY
4915  致伸
4916  事欣科
4919  新唐
4923  力士
4924  欣厚-KY
4927  泰鼎-KY
4930  灿星網
4931  新盛力
4933  友輝
4934  太極
4935  茂林-KY
4938  和碩
4939  亞電
4942  嘉彰
4943  康控-KY
4946  辣椒
4949  有成精密
4950  金耘國際
4951  精拓科
4952  凌通
4953  緯軟
4956  光鋐
4958  臻鼎-KY
4960  誠美材
4961  天鈺
4966  譜瑞-KY
4967  十銓
4968  立積
4971  IET-KY
4972  湯石照明
4973  廣穎
4974  亞泰
4976  佳凌
4977  眾達-KY
4979  華星光
4987  科誠
4989  榮科
4991  環宇-KY
4994  傳奇
4995  晶達
4999  鑫禾
5007  三星
5009  榮剛
5011  久陽
5013  強新
5014  建錩
5015  華祺
5016  松和
5201  凱衛
5202  力新
5203  訊連
5205  中茂
5206  坤悅
5209  新鼎
5210  寶碩
5211  蒙恬
5212  凌網
5213  亞昕
5215  科嘉-KY
5220  萬達光電
5222  全訊
5223  安力-KY
5225  東科-KY
5227  立凱-KY
5228  鈺鎧
5230  雷笛克光學
5234  達興材料
5236  凌陽創新
5243  乙盛-KY
5244  弘凱
5245  智晶
5251  天鉞電
5258  虹堡
5263  智崴
5269  祥碩
5272  笙科
5274  信驊
5276  達輝-KY
5278  尚凡*
5283  禾聯碩
5284  jpp-KY
5285  界霖
5287  數字
5288  丰祥-KY
5289  宜鼎
5291  邑昇
5292  華懋
5299  杰力
5301  寶得利
5302  太欣
5306  桂盟
5309  系統電
5310  天剛
5312  寶島科
5314  世紀*
5315  光聯
5321  美而快
5324  士開
5328  華容
5340  建榮
5344  立衛
5345  馥鴻
5347  世界
5348  正能量智能
5351  鈺創
5353  台林
5355  佳總
5356  協益
5364  力麗店
5371  中光電
5381  合正
5386  青雲
5388  中磊
5392  能率
5398  慕康生醫
5403  中菲
5410  國眾
5425  台半
5426  振發
5432  新門
5434  崇越
5438  東友
5439  高技
5443  均豪
5450  南良
5452  佶優
5455  昇益
5457  宣德
5460  同協
5464  霖宏
5465  富驊
5468  凱鈺
5469  瀚宇博
5471  松翰
5474  聰泰
5475  德宏
5478  智冠
5481  新華
5483  中美晶
5484  慧友
5487  通泰
5488  松普
5489  彩富
5490  同亨
5493  三聯
5498  凱崴
5508  永信建
5511  德昌
5512  力麒
5514  三豐
5515  建國
5516  雙喜
5519  隆大
5520  力泰
5521  工信
5522  遠雄
5523  豐謙
5525  順天
5529  鉅陞
5530  龍巖
5531  鄉林
5533  皇鼎
5534  長虹
5536  聖暉*
5538  東明-KY
5543  桓鼎-KY
5546  永固-KY
5547  久舜
5548  安倉
5601  台聯櫃
5603  陸海
5604  中連
5607  遠雄港
5608  四維航
5609  中菲行
5701  劍湖山
5703  亞都
5704  老爺知
5706  鳳凰
5864  致和證
5871  中租-KY
5871A  中租-KY甲特
5876  上海商銀
5878  台名
5880  合庫金
5902  德記
5903  全家
5904  寶雅
5905  南仁湖
5906  台南-KY
5907  大洋-KY
6005  群益證
6015  宏遠證
6016  康和證
6020  大展證
6021  美好證
6023  元大期
6024  群益期
6026  福邦證
6101  寬魚國際
6103  合邦
6104  創惟
6108  競國
6109  亞元
6111  大宇資
6112  邁達特
6113  亞矽
6114  久威
6115  鎰勝
6116  彩晶
6117  迎廣
6118  建達
6120  達運
6121  新普
6122  擎邦
6123  上奇
6124  業強
6125  廣運
6126  信音
6127  九豪
6128  上福
6129  普誠
6130  上亞科技
6133  金橋
6134  萬旭
6136  富爾特
6138  茂達
6139  亞翔
6140  訊達
6141  柏承
6142  友勁
6143  振曜
6144  得利影
6146  耕興
6147  頎邦
6148  驊宏資
6150  撼訊
6151  晉倫
6152  百一
6153  嘉聯益
6154  順發
6155  鈞寶
6156  松上
6158  禾昌
6160  欣技
6161  捷波
6163  華電網
6164  華興
6165  浪凡
6166  凌華
6167  久正
6168  宏齊
6169  昱泉
6170  統振
6171  大城地產
6173  信昌電
6174  安碁
6175  立敦
6176  瑞儀
6177  達麗
6179  亞通
6180  橘子
6182  合晶
6183  關貿
6184  大豐電
6185  幃翔
6186  新潤
6187  萬潤
6188  廣明
6189  豐藝
6190  萬泰科
6191  精成科
6192  巨路
6194  育富
6195  詩肯
6196  帆宣
6197  佳必琪
6198  瑞築
6199  天品
6201  亞弘電
6202  盛群
6203  海韻電
6204  艾華
6205  詮欣
6206  飛捷
6207  雷科
6208  日揚
6209  今國光
6210  慶生
6212  理銘
6213  聯茂
6214  精誠
6215  和椿
6216  居易
6217  中探針
6218  豪勉
6219  富旺
6220  岳豐
6221  晉泰
6222  立軒
6223  旺矽
6224  聚鼎
6225  天瀚
6226  光鼎
6227  茂綸
6228  全譜
6229  研通
6230  尼得科超眾
6231  系微
6233  旺玖
6234  高僑
6235  華孚
6236  中湛
6237  驊訊
6239  力成
6240  松崗
6241  易通展
6242  立康
6243  迅杰
6244  茂迪
6245  立端
6246  臺龍
6248  沛波
6257  矽格
6259  百徽
6261  久元
6263  普萊德
6264  富裔
6265  方土昶
6266  泰詠
6269  台郡
6270  倍微
6271  同欣電
6272  驊陞
6274  台燿
6275  元山
6276  安鈦克
6277  宏正
6278  台表科
6279  胡連
6281  全國電
6282  康舒
6283  淳安
6284  佳邦
6285  啟碁
6290  良維
6291  沛亨
6292  迅德
6294  智基
6405  悅城
6409  旭隼
6411  晶焱
6412  群電
6414  樺漢
6415  矽力*-KY
6416  瑞祺電通
6417  韋僑
6418  詠昇
6419  京晨科
6423  億而得
6425  易發
6426  統新
6431  光麗-KY
6432  今展科
6435  大中
6438  迅得
6441  廣錠
6442  光聖
6443  元晶
6446  藥華藥
6449  鈺邦
6451  訊芯-KY
6456  GIS-KY
6461  益得
6462  神盾
6464  台數科
6465  威潤
6469  大樹
6470  宇智
6472  保瑞
6474  華豫寧
6477  安集
6482  弘煜科
6485  點序
6486  互動
6488  環球晶
6491  晶碩
6492  生華科
6494  九齊
6496  科懋
6498  久禾光
6499  益安
6504  南六
6505  台塑化
6506  雙邦
6508  惠光
6509  聚和
6510  精測
6512  啟發電
6515  穎崴
6516  勤崴國際
6517  保勝光學
6523  達爾膚
6525  捷敏-KY
6526  達發
6527  明達醫
6530  創威
6531  愛普*
6532  瑞耘
6533  晶心科
6534  正瀚-創
6535  順藥
6538  倉和
6541  泰福-KY
6542  隆中
6546  正基
6547  高端疫苗
6548  長科*
6550  北極星藥業-KY
6552  易華電
6556  勝品
6558  興能高
6560  欣普羅
6561  是方
6568  宏觀
6569  醫揚
6570  維田
6573  虹揚-KY
6574  霈方
6576  逸達
6577  勁豐
6578  達邦蛋白
6579  研揚
6581  鋼聯
6582  申豐
6584  南俊國際
6585  鼎基
6588  東典光電
6589  台康生技
6590  普鴻
6591  動力-KY
6592  和潤企業
6592A  和潤企業甲特
6592B  和潤企業乙特
6593  台灣銘板
6596  寬宏藝術
6597  立誠
6598  ABC-KY
6603  富強鑫
6605  帝寶
6606  建德工業
6609  瀧澤科
6612  奈米醫材
6613  朋億*
6614  資拓宏宇
6615  慧智
6616  特昇-KY
6617  共信-KY
6620  漢達
6624  萬年清
6625  必應
6629  泰金-KY
6637  醫影
6640  均華
6641  基士德-KY
6642  富致
6643  M31
6645  金萬林-創
6649  台生材
6651  全宇昕
6654  天正國際
6655  科定
6657  華安
6658  聯策
6661  威健生技
6662  樂斯科
6664  群翊
6666  羅麗芬-KY
6667  信紘科
6668  中揚光
6669  緯穎
6670  復盛應用
6671  三能-KY
6672  騰輝電子-KY
6674  鋐寶科技
6679  鈺太
6680  鑫創電子
6683  雍智科技
6684  安格
6689  伊雲谷
6690  安碁資訊
6691  洋基工程
6692  進能服
6693  廣閎科
6695  芯鼎
6697  東捷資訊
6698  旭暉應材
6703  軒郁
6706  惠特
6708  天擎
6712  長聖
6715  嘉基
6716  應廣
6719  力智
6720  久昌
6721  信實
6722  輝創
6725  矽科宏晟
6727  亞泰金屬
6728  上洋
6730  常廣
6732  昇佳電子
6733  博晟生醫
6735  美達科技
6739  竹陞科技
6741  91APP*-KY
6742  澤米
6743  安普新
6751  智聯服務
6752  叡揚
6753  龍德造船
6754  匯僑設計
6756  威鋒電子
6757  台灣虎航
6761  穩得
6762  達亞
6763  綠界科技*
6767  台微醫
6768  志強-KY
6770  力積電
6771  平和環保-創
6776  展碁國際
6781  AES-KY
6782  視陽
6785  昱展新藥
6788  華景電
6789  采鈺
6790  永豐實
6791  虎門科技
6792  詠業
6794  向榮生技
6796  晉弘
6799  來頡
6803  崑鼎
6804  明係
6805  富世達
6806  森崴能源
6807  峰源-KY
6811  宏碁資訊
6821  聯寶
6823  濾能
6829  千附精密
6830  汎銓
6831  邁科
6834  天二科技
6835  圓裕
6838  台新藥
6840  東研信超
6841  長佳智能
6843  進典
6844  諾貝兒
6846  綠茵
6854  錼創科技-KY創
6855  數泓科
6856  鑫傳
6859  伯特光
6861  睿生光電
6862  三集瑞-KY
6863  永道-KY
6865  偉康科技
6869  雲豹能源
6870  騰雲
6872  浩宇生醫
6873  泓德能源
6874  倍力
6875  國邑*
6877  鏵友益
6881  潤德
6884  海柏特
6885  全福生技
6887  寶綠特-KY
6890  來億-KY
6894  衛司特
6895  宏碩系統
6899  創為精密
6901  鑽石投資
6902  GOGOLOOK
6903  巨漢
6904  伯鑫
6906  現觀科
6907  雅特力-KY
6909  創控
6910  德鴻
6913  鴻呈
6914  阜爾運通
6916  華凌
6918  愛派司
6919  康霈*
6921  嘉雨思-創
6922  宸曜
6923  中台
6924  榮惠-KY創
6925  意藍
6928  攸泰科技
6929  佑全
6931  青松健康
6933  AMAX-KY
6934  心誠鎂
6936  永鴻生技
6937  天虹
6944  兆聯實業
6949  沛爾生醫-創
6951  青新-創
6952  大武山
6953  家碩
6955  邦睿生技-創
6957  裕慶-KY
6958  日盛台駿
6958A  日盛台駿甲特
6961  旅天下
6962  奕力-KY
6965  中傑-KY
6967  汎瑋材料
6968  萬達寵物
6969  成信實業*-創
6971  惠民實業
6982  大井泵浦
6988  威力暘-創
6994  富威電力
6996  力領科技
6997  博弘
7402  邑錡
7547  碩網
7556  意德士
7584  樂意
7610  聯友金屬-創
7631  聚賢研發-創
7642  昶瑞機電
7703  銳澤
7704  明遠精密
7705  三商餐飲
7708  全家餐飲
7709  榮田
7711  永擎
7712  博盛半導體
7713  威力德生醫
7714  創泓科技
7715  裕山
7716  昱臺國際
7717  萊德光電-KY
7718  友鋮
7721  微程式
7722  LINEPAY
7723  築間
7728  光焱科技
7730  暉盛-創
7732  金興精密
7734  印能科技
7736  虎山
7738  東聯互動
7740  熙特爾-創
7743  金利食安
7744  崴寶
7747  昕奇雲端
7749  意騰-KY
7750  新代
7751  竑騰
7753  星亞
7757  金色三麥
7765  中華資安
7767  仁大資訊
7769  鴻勁
7770  君曜
7777  能率亞洲
7780  大研生醫*
7782  光速火箭
7786  東方風能
7788  松川精密
7791  皇家可口
7792  安葆
7795  長廣
7799  禾榮科
7805  威聯通
7810  捷創科技
7823  奧義賽博-KY創
8011  台通
8016  矽創
8021  尖點
8024  佑華
8027  鈦昇
8028  昇陽半導體
8032  光菱
8033  雷虎
8034  榮群
8038  長園科
8039  台虹
8040  九暘
8042  金山電
8043  蜜望實
8044  網家
8045  達運光電
8046  南電
8047  星雲
8048  德勝
8049  晶采
8050  廣積
8054  安國
8059  凱碩
8064  東捷
8066  來思達
8067  志旭
8068  全達
8069  元太
8070  長華*
8071  能率網通
8072  陞泰
8074  鉅橡
8076  伍豐
8077  洛碁
8080  泰霖
8081  致新
8083  瑞穎
8084  巨虹
8085  福華
8086  宏捷科
8087  麗升能源
8088  品安
8089  康全電訊
8091  翔名
8092  建暐
8093  保銳
8096  擎亞
8097  常珵
8099  大世科
8101  華冠
8102  傑霖科技
8103  瀚荃
8104  錸寶
8105  凌巨
8107  大億金茂
8109  博大
8110  華東
8111  立碁
8112  至上
8112A  至上甲特
8114  振樺電
8121  越峰
8131  福懋科
8147  正淩
8150  南茂
8155  博智
8162  微矽電子-創
8163  達方
8171  天宇
8176  智捷
8182  加高
8183  精星
8201  無敵
8210  勤誠
8213  志超
8215  明基材
8222  寶一
8227  巨有科技
8234  新漢
8240  華宏
8249  菱光
8255  朋程
8261  富鼎
8271  宇瞻
8272  全景軟體
8277  商丞
8279  生展
8284  三竹
8289  泰藝
8299  群聯
8341  日友
8342  益張
8349  恒耀
8349A  恒耀甲特
8354  冠好
8358  金居
8367  建新國際
8374  羅昇
8383  千附
8390  金益鼎
8401  白紗科
8403  盛弘
8404  百和興業-KY
8409  商之器
8410  森田
8411  福貞-KY
8415  大國鋼
8416  實威
8421  旭源
8422  可寧衛*
8423  保綠-KY
8424  惠普
8426  紅木-KY
8429  金麗-KY
8431  匯鑽科
8432  東生華
8433  弘帆
8435  鉅邁
8436  大江
8437  大地-KY
8438  昶昕
8440  綠電
8442  威宏-KY
8443  阿瘦
8444  綠河-KY
8446  華研
8450  霹靂
8454  富邦媒
8455  大拓-KY
8462  柏文
8463  潤泰材
8464  億豐
8466  美吉吉-KY
8467  波力-KY
8472  夠麻吉
8473  山林水
8476  台境*
8477  創業家
8478  東哥遊艇
8481  政伸
8482  商億-KY
8487  愛爾達-創
8488  吉源-KY
8489  三貝德
8499  鼎炫-KY
8905  裕國
8906  花王
8908  欣雄
8916  光隆
8917  欣泰
8921  沈氏
8923  時報
8924  大田
8926  台汽電
8927  北基
8928  鉅明
8929  富堡
8930  青鋼
8931  大汽電
8932  智通*
8933  愛地雅
8935  邦泰
8936  國統
8937  合騏
8938  明安
8940  新天地
8941  關中
8942  森鉅
8996  高力
9103  美德醫療-DR
910322  康師傅-DR
9105  泰金寶-DR
910861  神州-DR
9110  越南控-DR
911608  明輝-DR
911622  泰聚亨-DR
911868  同方友友-DR
912000  晨訊科-DR
9136  巨騰-DR
9802  鈺齊-KY
9902  台火
9904  寶成
9905  大華
9906  欣巴巴
9907  統一實
9908  大台北
9910  豐泰
9911  櫻花
9912  偉聯
9914  美利達
9917  中保科
9918  欣天然
9919  康那香
9921  巨大
9924  福興
9925  新保
9926  新海
9927  泰銘
9928  中視
9929  秋雨
9930  中聯資源
9931  欣高
9933  中鼎
9934  成霖
9935  慶豐富
9937  全國
9938  百和
9939  宏全
9940  信義
9941  裕融
9941A  裕融甲特
9942  茂順
9943  好樂迪
9944  新麗
9945  潤泰新
9946  三發地產
9949  琉園
9950  萬國通
9951  皇田
9955  佳龍
9958  世紀鋼
9960  邁達康
9962  有益`;

const parseStockList = (text) => text.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
  const match = l.match(/^(\S+)\s+(.+)$/); return match ? { id: match[1], name: match[2] } : { id: l, name: '' };
});
const STOCKS = parseStockList(RAW_STOCK_LIST);
const getRealSymbol = (input) => {
  if (!input || typeof input !== 'string') return '';
  const str = input.trim(); let possibleId = str.split(/\s+/)[0]; 
  let found = STOCKS.find(s => s.id === possibleId || s.name === possibleId || s.id === str || s.name === str);
  return found ? found.id : possibleId;
};
const getFullName = (input) => {
  if (!input || typeof input !== 'string') return '';
  const id = getRealSymbol(input); let found = STOCKS.find(s => s.id === id); return found ? `${found.id} ${found.name}` : input;
};

// === 客製化無敵彈窗 ===
const CustomModal = ({ modal }) => {
  if (!modal) return null;
  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 flex items-center justify-center p-4 backdrop-blur-md pointer-events-auto">
      <div className="bg-[#0f172a] border border-cyan-800 rounded-xl shadow-[0_0_30px_rgba(8,145,178,0.3)] w-full max-w-sm p-6 flex flex-col gap-5 animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold text-cyan-400 leading-snug">{modal.message}</h3>
        {modal.type === 'prompt' && (
          <input
            autoFocus
            type="text"
            id="global-modal-input"
            className="bg-slate-900 border-2 border-cyan-800 p-2.5 rounded-lg w-full text-cyan-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none font-bold placeholder-slate-600"
            onKeyDown={(e) => { if (e.key === 'Enter') modal.onConfirm(e.target.value); }}
          />
        )}
        <div className="flex justify-end gap-3 mt-2">
          {modal.type !== 'alert' && (
            <button onClick={modal.onCancel} className="px-5 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded-lg hover:bg-slate-700 transition-colors">
              取消
            </button>
          )}
          <button
            onClick={() => {
              if (modal.type === 'prompt') modal.onConfirm(document.getElementById('global-modal-input').value);
              else modal.onConfirm();
            }}
            className="px-5 py-2.5 bg-cyan-700 text-white font-bold rounded-lg hover:bg-cyan-600 shadow-[0_0_15px_rgba(8,145,178,0.4)] transition-all"
          >
            確定
          </button>
        </div>
      </div>
    </div>
  );
};

// ✨ 頂部科技感面板模組 Panel (可收合)
const Panel = ({ title, isOpen, onToggle, children, icon }) => (
  <div className="bg-[#0f172a] rounded-xl shadow-[0_0_15px_rgba(8,145,178,0.15)] border border-cyan-900/50 overflow-hidden flex flex-col mb-2 transition-all shrink-0">
    <div className="p-3 sm:p-3 bg-slate-800/40 flex justify-between items-center cursor-pointer select-none hover:bg-slate-800/80 transition-colors border-b border-cyan-900/30" onClick={onToggle}>
      <div className="font-bold text-cyan-400 flex items-center gap-2 tracking-wide text-sm">
        <span className="text-lg">{icon}</span> {title}
      </div>
      <div className="text-cyan-300 font-bold text-xs bg-slate-900/80 px-3 py-1.5 rounded-full shadow-inner border border-cyan-800 flex items-center gap-1">
        {isOpen ? '▲ 收起面板' : '▼ 展開設定'}
      </div>
    </div>
    {isOpen && <div className="p-4 bg-[#020617]">{children}</div>}
  </div>
);

// ✨ 側邊科技感模組 TechCard (不可收合)
const TechCard = ({ title, icon, children, glow = "cyan" }) => {
  const glowColors = {
    cyan: "shadow-[0_0_15px_rgba(6,182,212,0.15)] border-cyan-900/50 before:from-cyan-500 before:to-blue-600 text-cyan-400",
    purple: "shadow-[0_0_15px_rgba(168,85,247,0.15)] border-purple-900/50 before:from-purple-500 before:to-pink-600 text-purple-400",
    amber: "shadow-[0_0_15px_rgba(245,158,11,0.15)] border-amber-900/50 before:from-amber-500 before:to-orange-600 text-amber-400",
  };
  const theme = glowColors[glow] || glowColors.cyan;

  return (
    <div className={`bg-[#0f172a] border rounded-xl overflow-hidden flex flex-col relative before:absolute before:top-0 before:left-0 before:w-full before:h-1 before:bg-gradient-to-r ${theme} h-full`}>
      <div className="p-3 bg-slate-800/40 flex justify-between items-center border-b border-slate-700/50">
        <div className={`font-bold flex items-center gap-2 tracking-wide text-sm`}><span className="text-lg">{icon}</span> {title}</div>
      </div>
      <div className="p-4 flex-1">{children}</div>
    </div>
  );
};

// ✨ 修正日期
const getWeekKey = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr; 
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
};

const aggregateData = (dailyData, tf) => {
    if (!dailyData || dailyData.length === 0) return [];
    if (tf === 'D') return dailyData;

    const groupedMap = new Map();
    dailyData.forEach(d => {
        if (!d || !d.date) return;
        const key = tf === 'W' ? getWeekKey(d.date) : d.date.substring(0, 7);
        if (!groupedMap.has(key)) {
            groupedMap.set(key, { ...d, date: key });
        } else {
            const existing = groupedMap.get(key);
            existing.high = Math.max(existing.high, d.high);
            existing.low = Math.min(existing.low, d.low);
            existing.close = d.close;
            existing.volume += d.volume;
            // ✨ 補上：確保切換成週K/月K時，三大法人與資券也會跟著累加！
            existing.foreign = (existing.foreign || 0) + (d.foreign || 0);
            existing.trust = (existing.trust || 0) + (d.trust || 0);
            existing.dealer = (existing.dealer || 0) + (d.dealer || 0);
            existing.marginDiff = (existing.marginDiff || 0) + (d.marginDiff || 0);
            existing.shortDiff = (existing.shortDiff || 0) + (d.shortDiff || 0);
        }
    });
    return Array.from(groupedMap.values());
};

const App = () => {
  const [appModal, setAppModal] = useState(null);
  const showAlert = (msg) => setAppModal({ type: 'alert', message: msg, onConfirm: () => setAppModal(null) });

  // ✨ Firebase 認證與資料庫載入狀態
  const [user, setUser] = useState(null);
  const [dbLoaded, setDbLoaded] = useState(false);

  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('MY_STOCK_API_KEY') || '');
  const [showKeySetup, setShowKeySetup] = useState(() => !localStorage.getItem('MY_STOCK_API_KEY'));
  const [tempKey, setTempKey] = useState('');

  const [finmindApiKey, setFinmindApiKey] = useState(() => localStorage.getItem('MY_STOCK_FINMIND_KEY') || '');
  const [tempFmKey, setTempFmKey] = useState('');

  const [symbolInput, setSymbolInput] = useState(''); 
  const [currentViewedSymbol, setCurrentViewedSymbol] = useState(''); // ✨ 新增：用來記錄目前「成功載入並顯示在圖表上」的股號
  const [issuedShares, setIssuedShares] = useState(''); 
  const [displayCount, setDisplayCount] = useState(120);
  const [timeframe, setTimeframe] = useState('D');
  
  // ✨ 新增副圖指標狀態 (預設關閉 None)
  const [indicatorType, setIndicatorType] = useState('None');
  
  // 1. 副圖指標參數記憶
  const [indicatorParams, setIndicatorParams] = useState(() => {
    try {
      const saved = localStorage.getItem('MY_STOCK_INDICATOR_PARAMS');
      return saved ? JSON.parse(saved) : {
        macd: { fast: 12, slow: 26, signal: 9 }, kd: { rsv: 9, k: 3, d: 3 }, rsi: { p1: 6, p2: 12 }, obv: { ma: 20 }, tower: { p: 3 }
      };
    } catch (e) { return { macd: { fast: 12, slow: 26, signal: 9 }, kd: { rsv: 9, k: 3, d: 3 }, rsi: { p1: 6, p2: 12 }, obv: { ma: 20 }, tower: { p: 3 } }; }
  });
  useEffect(() => { localStorage.setItem('MY_STOCK_INDICATOR_PARAMS', JSON.stringify(indicatorParams)); }, [indicatorParams]);

  // 2. 主圖均線 MA 參數記憶 (加入 show 獨立開關)
  const [maParams, setMaParams] = useState(() => {
    try {
      const saved = localStorage.getItem('MY_STOCK_MA_PARAMS');
      return saved ? JSON.parse(saved) : { 
        ma1: { p: 10, c: '#eab308', w: 1.5, show: true }, ma2: { p: 20, c: '#22d3ee', w: 1.5, show: true }, ma3: { p: 60, c: '#ec4899', w: 1.5, show: true } 
      };
    } catch (e) { return { ma1: { p: 10, c: '#eab308', w: 1.5, show: true }, ma2: { p: 20, c: '#22d3ee', w: 1.5, show: true }, ma3: { p: 60, c: '#ec4899', w: 1.5, show: true } }; }
  });
  useEffect(() => { localStorage.setItem('MY_STOCK_MA_PARAMS', JSON.stringify(maParams)); }, [maParams]);

  // 3. 均量線 VMA 參數記憶 (加入 show 獨立開關)
  const [vmaParams, setVmaParams] = useState(() => {
    try {
      const saved = localStorage.getItem('MY_STOCK_VMA_PARAMS');
      return saved ? JSON.parse(saved) : {
        vma1: { p: 5, c: '#f59e0b', w: 1.5, show: true }, vma2: { p: 13, c: '#8b5cf6', w: 1.5, show: true }, vma3: { p: 34, c: '#10b981', w: 1.5, show: true }
      };
    } catch (e) { return { vma1: { p: 5, c: '#f59e0b', w: 1.5, show: true }, vma2: { p: 13, c: '#8b5cf6', w: 1.5, show: true }, vma3: { p: 34, c: '#10b981', w: 1.5, show: true } }; }
  });
  useEffect(() => { localStorage.setItem('MY_STOCK_VMA_PARAMS', JSON.stringify(vmaParams)); }, [vmaParams]);

  // ✨ 新增雲端畫板儲存狀態
  const [savedLayouts, setSavedLayouts] = useState(() => {
    try {
      const saved = localStorage.getItem('MY_STOCK_LAYOUTS');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('MY_STOCK_LAYOUTS', JSON.stringify(savedLayouts));
  }, [savedLayouts]);

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false); 
  const [error, setError] = useState('');
  const [rawDailyData, setRawDailyData] = useState([]);
  const [klineData, setKlineData] = useState([]);
  
  const displayFullname = getFullName(currentViewedSymbol); // ✨ 修改：圖表名稱改吃當前觀看的股號，不被輸入框清空影響
  const currentRealSymbol = getRealSymbol(currentViewedSymbol); // ✨ 新增：目前觀看的真實股號，傳給圖表存檔用
  const activeToolTargetName = getFullName(symbolInput || currentViewedSymbol); // ✨ 新增：產業工具目標 (優先吃打字的，否則吃圖表正在看的)

  const [panelsOpen, setPanelsOpen] = useState({ config: false }); // ✨ 補回這行：控制面板收合狀態
  // ✨ 狀態開關管理
  const [toggles, setToggles] = useState({
    showMA: true, showVolume: true, showVolSignal: true, showTrend: true, showHeidun: false, showCrosshair: false, showBBands: false,
    showBBands3: false,// ✨ 新增：高布林(3.0) 獨立開關
    showBBandsCompress: false, // ✨ 新增：布林壓縮區塊 開關
    showTooltipDetail: false // ✨ 新增：查價詳細資訊勾選鍵（預設關閉）
  });

  // 4. 自訂策略清單記憶
  const [customStrategies, setCustomStrategies] = useState(() => {
    try {
      const saved = localStorage.getItem('MY_STOCK_CUSTOM_STRATEGIES');
      return saved ? JSON.parse(saved) : [
        { id: 1, name: '天機K', marker: '🌟', matchType: 'AND', isActive: false, conditions: [
          { left: { target: 'bodyRatio', scope: 'today', n: 1 }, operator: '>=', rightType: 'number', rightNumber: 3.5, rightMetric: { target: 'close', scope: 'ago', n: 1 }, rightMathOp: 'none', rightMathNum: 1 },
          { left: { target: 'volume', scope: 'today', n: 1 }, operator: '>=', rightType: 'metric', rightMetric: { target: 'volume', scope: 'ago', n: 1 }, rightMathOp: '*', rightMathNum: 2 }
        ]}
      ];
    } catch (e) {
      return [
        { id: 1, name: '天機K', marker: '🌟', matchType: 'AND', isActive: false, conditions: [
          { left: { target: 'bodyRatio', scope: 'today', n: 1 }, operator: '>=', rightType: 'number', rightNumber: 3.5, rightMetric: { target: 'close', scope: 'ago', n: 1 }, rightMathOp: 'none', rightMathNum: 1 },
          { left: { target: 'volume', scope: 'today', n: 1 }, operator: '>=', rightType: 'metric', rightMetric: { target: 'volume', scope: 'ago', n: 1 }, rightMathOp: '*', rightMathNum: 2 }
        ]}
      ];
    }
  });

  useEffect(() => {
    localStorage.setItem('MY_STOCK_CUSTOM_STRATEGIES', JSON.stringify(customStrategies));
  }, [customStrategies]); 

  // === ☁️ Firebase 雲端狀態管理 ===
  // 1. 初始化 Auth 登入
  useEffect(() => {
    if (!auth) { setDbLoaded(true); return; }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth init error:", e);
        setDbLoaded(true);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setDbLoaded(true); // 若驗證失敗，結束載入畫面
    });
    return () => unsubscribe();
  }, []);

  // 2. 登入成功後，從雲端讀取專屬設定
  useEffect(() => {
    if (!user || !db) return;
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'main');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.userApiKey) {
            setUserApiKey(data.userApiKey);
            setShowKeySetup(false);
          }
          if (data.indicatorParams) setIndicatorParams(data.indicatorParams);
          if (data.maParams) setMaParams(data.maParams);
          if (data.vmaParams) setVmaParams(data.vmaParams);
          if (data.customStrategies) setCustomStrategies(data.customStrategies);
          if (data.savedLayouts) setSavedLayouts(data.savedLayouts); // ✨ 讀取畫板
        }
      } catch (e) { console.error("Firestore read error", e); }
      setDbLoaded(true); // 資料載入完成
    };
    fetchSettings();
  }, [user]);

  // 3. 監聽參數變更，自動同步回雲端 (Debounce 防手震，避免寫入過於頻繁)
  useEffect(() => {
    if (!user || !db || !dbLoaded) return;
    const timeoutId = setTimeout(() => {
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'main');
        setDoc(docRef, {
          userApiKey,
          indicatorParams,
          maParams,
          vmaParams,
          customStrategies,
          savedLayouts // ✨ 同步寫入畫板
        }, { merge: true });
      } catch (e) { console.error("Firestore write error", e); }
    }, 1500); 
    return () => clearTimeout(timeoutId);
  }, [userApiKey, indicatorParams, maParams, vmaParams, customStrategies, savedLayouts, user, dbLoaded]);

  // ✨ AI 讀圖與排行榜狀態 (加入 localStorage 記憶功能)
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  const fileInputRef = useRef(null);
  // ✨ 貼上文字排行的狀態
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  // 初始化時去記憶體找找看有沒有上次存的名單
  const [rankingList, setRankingList] = useState(() => {
    try {
      const saved = localStorage.getItem('MY_STOCK_RANKING_LIST');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // 只要 rankingList 有變動（例如 AI 讀完新圖），就自動存入記憶體
  useEffect(() => {
    localStorage.setItem('MY_STOCK_RANKING_LIST', JSON.stringify(rankingList));
  }, [rankingList]);

  // ✨ 新增：自選股狀態記憶 (Watchlist)
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('MY_STOCK_WATCHLIST');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  useEffect(() => {
    localStorage.setItem('MY_STOCK_WATCHLIST', JSON.stringify(watchlist));
  }, [watchlist]);

  // ✨ 新增：彈窗的頁籤切換與排序狀態
  const [rankingTab, setRankingTab] = useState('ranking'); // 'ranking' (讀圖排行) 或 'watchlist' (自選)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' }); // 預設無排序
  
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderFormula, setBuilderFormula] = useState([]);
  const [builderTab, setBuilderTab] = useState('運算');
  // ✨ 新增：策略名稱與圖標的狀態
  const [strategyName, setStrategyName] = useState('');
  const [strategyMarker, setStrategyMarker] = useState('🎯'); 

  // ==============================================
  // ✨ 新增：處理鍵盤輸入的智能合併邏輯 (連續數字會自動連接)
  // ==============================================
  const handleFormulaInput = (btn) => {
    setBuilderFormula(prev => {
      if (prev.length === 0) return [btn];
      const lastItem = prev[prev.length - 1];

      // 判斷按下的按鈕與最後一個項目是否都是數字或小數點
      const isBtnNumeric = /^[0-9.]+$/.test(btn);
      const isLastNumeric = /^[0-9.]+$/.test(lastItem);

      if (isBtnNumeric && isLastNumeric) {
        // 連接數字 (例如 '1' + '0' 變成 '10')
        const newArr = [...prev];
        newArr[newArr.length - 1] = lastItem + btn;
        return newArr;
      } else {
        // 當作新詞彙加入
        return [...prev, btn];
      }
    });
  };

  // ✨ 新增：優化退格邏輯 (數字一個一個字刪，詞彙整塊刪)
  const handleBackspace = () => {
    setBuilderFormula(prev => {
      if (prev.length === 0) return prev;
      const lastItem = prev[prev.length - 1];
      
      // 如果最後一個是純數字字串且長度大於1，則刪除最後一個字元
      if (/^[0-9.]+$/.test(lastItem) && lastItem.length > 1) {
        const newArr = [...prev];
        newArr[newArr.length - 1] = lastItem.slice(0, -1);
        return newArr;
      } else {
        // 否則整個詞彙刪掉
        return prev.slice(0, -1);
      }
    });
  };

  // ✨ 翻譯蒟蒻：把中文陣列轉換成系統懂的 JSON 條件
  const parseFormulaToStrategy = (formulaArray, customName, customMarker) => {
    try {
      const conditions = [];
      let currentLeft = null;
      let currentOp = null;
      let matchType = 'AND'; // 預設多個條件用「而且(AND)」連接

      // 字典表：把中文名詞對應到我們系統的底層變數
      const dictionary = {
        '開盤價': { target: 'open', scope: 'today', n: 1 },
        '最高價': { target: 'high', scope: 'today', n: 1 },
        '最低價': { target: 'low', scope: 'today', n: 1 },
        '收盤價': { target: 'close', scope: 'today', n: 1 },
        '成交量': { target: 'volume', scope: 'today', n: 1 },
        '漲跌幅': { target: 'changeRatio', scope: 'today', n: 1 },
        '5日均線': { target: 'close', scope: 'avg', n: 5 },
        '10日均線': { target: 'close', scope: 'avg', n: 10 },
        '20日均線': { target: 'close', scope: 'avg', n: 20 },
        '5日均量': { target: 'volume', scope: 'avg', n: 5 },
        '外資買賣超': { target: 'foreign', scope: 'today', n: 1 },
        '投信買賣超': { target: 'trust', scope: 'today', n: 1 },
        '自營商買賣超': { target: 'dealer', scope: 'today', n: 1 },
        '融資增減': { target: 'marginDiff', scope: 'today', n: 1 },
        // 👇 新增這區塊：技術指標細部連結 👇
        'K值': { target: 'kd.k', scope: 'today', n: 1 },
        'D值': { target: 'kd.d', scope: 'today', n: 1 },
        'RSI值': { target: 'rsi.rsi1', scope: 'today', n: 1 },
        'MACD值': { target: 'macd.macd', scope: 'today', n: 1 },
        'DIF值': { target: 'macd.dif', scope: 'today', n: 1 },
        'OSC值': { target: 'macd.osc', scope: 'today', n: 1 },
        'OBV值': { target: 'obv', scope: 'today', n: 1 },
        '威廉指標': { target: 'willr', scope: 'today', n: 1 },
        '布林上軌': { target: 'bbands.up', scope: 'today', n: 1 },
        '布林下軌': { target: 'bbands.down', scope: 'today', n: 1 }
      };

      // 解析邏輯
      for (let i = 0; i < formulaArray.length; i++) {
        let token = formulaArray[i];

        // 1. 處理時間偏移 (例如看到 "1日前的"，就把它跟下一個名詞組合)
        let offset = 0;
        if (token.includes('日前的')) {
          offset = parseInt(token) || 0;
          i++; // 跳到下一個詞
          if (i >= formulaArray.length) break;
          token = formulaArray[i]; 
        }

        if (token === '而且') {
          matchType = 'AND';
          continue;
        } else if (token === '或者') {
          matchType = 'OR';
          continue;
        }

        // 2. 如果遇到比較符號，就把它記下來當作 Operator
        if (['>', '<', '≥', '≤', '=', '≠'].includes(token)) {
          let op = token;
          if (op === '≥') op = '>=';
          if (op === '≤') op = '<=';
          if (op === '=') op = '==';
          if (op === '≠') op = '!=';
          currentOp = op;
          continue;
        }

        // 3. 判斷這個詞是數字還是字典裡的名詞
        let parsedValue;
        if (!isNaN(token)) {
          parsedValue = { type: 'number', value: parseFloat(token) };
        } else if (dictionary[token]) {
          parsedValue = { type: 'metric', metric: { ...dictionary[token], offset } };
        } else {
          // 如果遇到還沒支援的詞(例如外資買賣超)，先丟出錯誤
          throw new Error(`目前系統尚未支援「${token}」的資料，請先移除。`);
        }

        // 4. 組裝左邊與右邊
        if (!currentLeft) {
          if (parsedValue.type === 'number') throw new Error('公式左邊不能是純數字！');
          currentLeft = parsedValue.metric;
        } else if (currentOp) {
          // 已經有左邊跟符號了，現在這個一定是右邊！組裝完成！
          const condition = {
            left: currentLeft,
            operator: currentOp,
            rightType: parsedValue.type,
            rightNumber: parsedValue.type === 'number' ? parsedValue.value : null,
            rightMetric: parsedValue.type === 'metric' ? parsedValue.metric : null,
            rightMathOp: 'none',
            rightMathNum: 1
          };
          conditions.push(condition);
          // 重置狀態，準備迎接下一個條件（如果有「而且」的話）
          currentLeft = null;
          currentOp = null;
        }
      }

      // 如果有沒組裝完的（例如寫了 "收盤價 > " 就結束），提醒使用者
      if (currentLeft && currentOp) {
        throw new Error('公式尚未完成，比較符號後面缺少條件！');
      }

      return {
        id: Date.now(),
        name: customName || `自訂策略_${new Date().getHours()}${new Date().getMinutes()}`,
        marker: customMarker || '🎯',
        matchType: matchType,
        isActive: true,
        conditions: conditions
      };

    } catch (err) {
      // 翻譯失敗，回傳錯誤訊息
      return { error: err.message };
    }
  };

  const [draftStrategy, setDraftStrategy] = useState({
    name: '我的新策略', marker: '🔥', matchType: 'AND', conditions: [{ left: { target: 'close', scope: 'today', n: 1 }, operator: '>', rightType: 'metric', rightMetric: { target: 'close', scope: 'ago', n: 1 }, rightMathOp: 'none', rightMathNum: 1, rightNumber: 100 }]
  });

  useEffect(() => { 
    if (showKeySetup) {
      setTempKey(userApiKey);
      setTempFmKey(finmindApiKey);
    }
  }, [showKeySetup, userApiKey, finmindApiKey]);

  const handleSaveKey = () => {
    if (!tempKey.trim()) return showAlert('富果金鑰不能為空！');
    const key = tempKey.trim();
    const fmKey = tempFmKey.trim();
    setUserApiKey(key);
    setFinmindApiKey(fmKey);
    localStorage.setItem('MY_STOCK_API_KEY', key); 
    localStorage.setItem('MY_STOCK_FINMIND_KEY', fmKey); 
    setShowKeySetup(false);
  };

  const handleToggle = (key) => setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  const handleCustomToggle = (id) => setCustomStrategies(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  
  const deleteCustomStrategy = (id) => { 
    setAppModal({
      type: 'confirm',
      message: '確定要刪除這個自訂策略嗎？',
      onConfirm: () => {
        setCustomStrategies(prev => prev.filter(s => s.id !== id));
        setAppModal(null);
      },
      onCancel: () => setAppModal(null)
    });
  };

  const fetchWithRetry = async (url, options, maxRetries = 5) => {
    let delay = 1000;
    for (let i = 0; i < maxRetries; i++) {
      try { const response = await fetch(url, options); if (response.ok) return response; if (i === maxRetries - 1) return response; } 
      catch (e) { if (i === maxRetries - 1) throw e; }
      await new Promise(r => setTimeout(r, delay)); delay *= 2;
    }
  };

  const fetchSharesFromAI = async () => {
    if (!activeToolTargetName) return showAlert('請先輸入股號或載入K線');
    setAiLoading(true);
    try {
      const geminiApiKey = ""; 
      const prompt = `請搜尋台股 ${activeToolTargetName} 最新「總發行股數」及「董監事持股比例(%)」。計算公式：(總發行股數 / 1000) × (100% - 董監事持股比例%)。只回答計算出來的純數字結果(四捨五入)，不要單位與逗號。`;
      const payload = { contents: [{ parts: [{ text: prompt }] }], tools: [{ google_search: {} }], systemInstruction: { parts: [{ text: "只回覆純數字" }] } };
      const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json(); const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) { const match = text.match(/\d+/g); if (match) setIssuedShares(parseInt(match.join(''), 10)); else showAlert('AI 失敗，請手動輸入'); }
    } catch (err) { showAlert('AI 錯誤'); } finally { setAiLoading(false); }
  };

  const handleManualSearch = () => {
    if (!activeToolTargetName) return showAlert('請先輸入股號或載入K線');
    const query = `${activeToolTargetName} 只扣除董監(其他的不扣)後的在外流通股票張數是多少?`;
    window.open(`https://www.google.com/search?udm=50&q=${encodeURIComponent(query)}`, '_blank');
  };
  
  const handleGoogleAIAnalysis = () => {
    if (!activeToolTargetName) return showAlert("請先輸入股號或載入K線！");
    const query = `${activeToolTargetName} 
 主要產業在哪? 1)就是產業規模有多大, 國外廠及台股有關的有哪些?
 2)接下來這產業的新增需求是否有在加速, 且新增的年增需求金額會多少? 3)受惠的國外廠商/ 台股的巿佔率多少?能吃到多少新增需求金額? 而新增的需求金額和目前個股的年營收佔比如何, 有沒有受惠很多? 4)目前此產業有哪些廠有增加資本支出?且這資本支出對台股的受惠程度, 或台股也有產能滿載/要增加資本支出的狀況?`;
    window.open(`https://www.google.com/search?udm=50&q=${encodeURIComponent(query)}`, '_blank');
  };
  // ✨ 把圖片轉 Base64 的小工具
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result.split(',')[1]);
      fileReader.onerror = (error) => reject(error);
    });
  };

  // ✨ 處理截圖上傳與 AI 辨識 (專攻富邦排行榜)
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsRankingOpen(true);
    setIsLoadingRanking(true); 

    try {
      const base64Image = await convertToBase64(file);
      const geminiApiKey = ""; // 系統底層會自動代入環境金鑰
      
      const payload = {
        contents: [{
          role: "user",
          parts: [
            { text: "這是一張富邦證券(MoneyDJ)的台股排行榜截圖。請幫我精準辨識圖中表格，提取出所有的『股票代號(symbol)』、『股票名稱(name)』與『漲跌幅或狀態(change)』。請直接回傳嚴格的 JSON 陣列格式，不要任何 Markdown 標記，不要任何解釋。若沒有明確漲跌幅請預設填入'熱門'。格式範例：[{\"symbol\":\"2330\", \"name\":\"台積電\", \"change\":\"+1.5%\"}]" },
            { inlineData: { mimeType: file.type, data: base64Image } }
          ]
        }],
        generationConfig: { responseMimeType: "application/json" }
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";
      
      const cleanText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const rankingData = JSON.parse(cleanText);
      
      if(Array.isArray(rankingData) && rankingData.length > 0) {
          setRankingList(rankingData); // 這裡一更新，第一步的 useEffect 就會自動幫你存檔！
      } else {
          throw new Error("無法從圖片中解析出股票陣列");
      }
    } catch (error) {
      console.error("AI 辨識失敗:", error);
      showAlert("圖片辨識失敗，請確認截圖是否清晰包含股票代號！");
    } finally {
      setIsLoadingRanking(false);
      if (event.target) event.target.value = null; // 清空 input 讓下次可重選同張圖
    }
  };

  // ✨ 處理手動貼上文字排行 (玩股網專屬防擠壓 + 終極智慧解碼版)
  const handlePasteRanking = () => {
    if (!pasteText.trim()) return showAlert("請先貼上資料！");
    const lines = pasteText.split('\n');
    const newRanking = [];
    
    lines.forEach(line => {
      // 尋找 4 碼數字開頭的股號
      const match = line.match(/([0-9]{4}[a-zA-Z]?)/);
      if (match) {
        const symbol = match[1];
        const stockInfo = STOCKS.find(s => s.id === symbol);
        
        if (stockInfo && !newRanking.find(r => r.symbol === symbol)) {
          let change = '熱門';
          let volume = '-';
          
          // 1. 抓取成交量 (找字串中最後一個有逗號的數字結構)
          const volMatches = line.match(/\d{1,3}(?:,\d{3})+/g);
          if (volMatches) {
              volume = volMatches[volMatches.length - 1]; // 通常成交量在文字後半段
          } else {
              // 備用：用空格切開，找最大的數字
              let maxVol = 0;
              line.split(/[\s\t]+/).forEach(p => {
                  const num = parseInt(p.replace(/,/g, ''), 10);
                  if (num > 100 && num > maxVol && p !== symbol) {
                      maxVol = num;
                      volume = p;
                  }
              });
          }

          // 2. 抓取漲跌幅 (玩股網終極解碼器：尋找被兩個符號夾住的百分比)
          // 完美支援： ▲3.10 10 ▲14.81 或擠在一起的 ▲3.1010▲14.81
          const wantGooMatch = line.match(/([▲▼△▽\+\-])\s*\d+\.\d+\s*(\d+(?:\.\d+)?)\s*[▲▼△▽\+\-]/);
          if (wantGooMatch) {
              const sign = wantGooMatch[1].match(/[▲△\+]/) ? '+' : '-';
              change = `${sign}${wantGooMatch[2]}%`;
          } else {
              // 平盤特例判斷 (0.00 0 0.00)
              if (line.match(/0\.00\s*0\s*0\.00/)) {
                  change = '平盤';
              } else {
                  // 通用券商格式 (找第一個帶有 % 或 + - 且不是股號的區塊)
                  const parts = line.split(/[\s\t]+/);
                  let found = false;
                  parts.forEach(p => {
                      if (!found && p !== symbol) {
                          if (p.includes('%') || p.includes('停') || p.match(/^[+-]\d/)) {
                              // 把其他券商的 ▲ 轉成 +
                              change = p.replace(/[▲△]/g, '+').replace(/[▼▽]/g, '-');
                              found = true;
                          } else if (p.match(/^[▲▼△▽]\d/)) {
                              const sign = p.match(/[▲△]/) ? '+' : '-';
                              change = sign + p.replace(/[▲▼△▽]/, '') + '%';
                              found = true;
                          }
                      }
                  });
              }
          }

          newRanking.push({ symbol: stockInfo.id, name: stockInfo.name, change, volume });
        }
      }
    });

    if (newRanking.length > 0) {
      setRankingList(newRanking); 
      setIsPasteModalOpen(false); 
      setPasteText(""); 
      setIsRankingOpen(true);
    } else { 
      showAlert("找不到任何有效的台股代號，請確認貼上的文字格式！"); 
    }
  };

  // ✨ 邏輯 1：切換自選股 (加入或移除)
  const toggleWatchlist = (stock, e) => {
    e.stopPropagation(); // 防止點擊星星時觸發切換 K 線圖
    setWatchlist(prev => {
      const exists = prev.find(s => s.symbol === stock.symbol);
      if (exists) {
        return prev.filter(s => s.symbol !== stock.symbol); // 已經存在就移除
      } else {
        return [...prev, { ...stock, addedAt: Date.now() }]; // 不存在就加入，並記錄時間
      }
    });
  };

  // ✨ 邏輯 2：處理點擊標題排序
  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }; // 同一個欄位切換正反向
      }
      return { key, direction: 'desc' }; // 點擊新欄位，預設由大到小
    });
  };

  // ✨ 邏輯 3：即時運算排序後的清單給畫面顯示
  const getSortedData = (list) => {
    if (!sortConfig.key) return list;
    return [...list].sort((a, b) => {
      let valA = a[sortConfig.key] || '';
      let valB = b[sortConfig.key] || '';

      // 處理漲跌幅 (把 "+1.5%" 轉成數字 1.5 比較)
      if (sortConfig.key === 'change') {
        const numA = parseFloat(valA.toString().replace(/[+%]/g, '')) || 0;
        const numB = parseFloat(valB.toString().replace(/[+%]/g, '')) || 0;
        return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
      }
      
      // ✨ 升級版：處理成交量 (把 "12,345" 轉成純數字 12345 比較，如果是 '-' 則視為 0)
      if (sortConfig.key === 'volume') {
        const numA = parseInt(valA.toString().replace(/,/g, '')) || 0;
        const numB = parseInt(valB.toString().replace(/,/g, '')) || 0;
        return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
      }
      
      // 處理文字排序 (股號/股名)
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };
  // ✨ 修改 fetchStockData 讓它支援從畫板載入指定的股號
  const fetchStockData = async (overrideSymbol = null) => {
    const targetInput = (typeof overrideSymbol === 'string' ? overrideSymbol : null) || symbolInput;
    if (!targetInput) return showAlert('請先輸入股號');
    if (!userApiKey) { setShowKeySetup(true); return; }

    setLoading(true); setError('');
    try {
      const toDate = new Date(); 
      const fromDate = new Date(); 
      fromDate.setDate(toDate.getDate() - 360); 
      const targetSymbol = getRealSymbol(targetInput);
      
      const histUrl = `https://api.fugle.tw/marketdata/v1.0/stock/historical/candles/${targetSymbol}?timeframe=D&from=${fromDate.toISOString().split('T')[0]}&to=${toDate.toISOString().split('T')[0]}`;
      const histRes = await fetch(histUrl, { headers: { 'X-API-KEY': userApiKey } });
      
      if (histRes.status === 401 || histRes.status === 403) throw new Error("⚠️ 金鑰無效或沒有權限，請點擊右上角重新設定 API 金鑰！");
      if (!histRes.ok) throw new Error(`無法取得歷史資料 (HTTP ${histRes.status})`);
      
      const histData = await histRes.json();
      let candles = histData.data.reverse().map(d => ({ date: d.date, open: d.open, high: d.high, low: d.low, close: d.close, volume: Math.round(d.volume / 1000) }));

      try {
        const intraUrl = `https://api.fugle.tw/marketdata/v1.0/stock/intraday/quote/${targetSymbol}`;
        const intraRes = await fetch(intraUrl, { headers: { 'X-API-KEY': userApiKey } });
        if (intraRes.ok) {
          const json = await intraRes.json();
          const quote = json;
          
          if (quote) {
            const open = quote.openPrice || quote.previousClose;
            const high = quote.highPrice || open;
            const low = quote.lowPrice || open;
            const close = quote.closePrice || quote.lastPrice || quote.previousClose;
            let volume = quote.total?.tradeVolume || 0;

            if (open != null && close != null) {
              const currentCandle = { date: quote.date || new Date().toISOString().split('T')[0], open, high, low, close, volume };
              const lastIdx = candles.length - 1;
              if (lastIdx >= 0 && candles[lastIdx].date === currentCandle.date) candles[lastIdx] = currentCandle; 
              else candles.push(currentCandle); 
            }
          }
        }
      } catch (intraErr) { console.warn("盤中資料解析失敗", intraErr); }

      // ==========================================
      // ✨ [FinMind 融合區塊] 開始
      // ==========================================
      const fmToken = finmindApiKey; 
      const startDateStr = fromDate.toISOString().split('T')[0];
      const fmMap = {};

      try {
        let instUrl = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockInstitutionalInvestorsBuySell&data_id=${targetSymbol}&start_date=${startDateStr}`;
        let marginUrl = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockMarginPurchaseShortSale&data_id=${targetSymbol}&start_date=${startDateStr}`;
        if (fmToken) {
           instUrl += `&token=${fmToken}`;
           marginUrl += `&token=${fmToken}`;
        }

        const [instRes, marginRes] = await Promise.all([
          fetch(instUrl),
          fetch(marginUrl)
        ]);
        
        if (!instRes.ok || !marginRes.ok) throw new Error("FinMind API 回應異常");
        
        const instJson = await instRes.json();
        const marginJson = await marginRes.json();

        // 🌟 防呆：如果法人真的沒抓到，印在系統控制台讓我們知道發生什麼事
        if (!instJson.data || instJson.data.length === 0) {
           console.warn(`⚠️ 找不到 ${targetSymbol} 的法人資料，請確認該股是否有法人進出，或 FinMind 尚未更新。`);
        }

        // 2. 建立日期對照字典
        if (instJson.data) {
           instJson.data.forEach(d => {
               if (!fmMap[d.date]) fmMap[d.date] = { foreign: 0, trust: 0, dealer: 0, marginDiff: 0, shortDiff: 0 };
               
               // ✨ 支援不同大小寫的 API 改版防呆
               const buy = Number(d.buy || d.Buy || d.buy_vol || 0);
               const sell = Number(d.sell || d.Sell || d.sell_vol || 0);
               // ✨ 把名字轉成大寫，方便後面中英文一起比對
               const name = String(d.name || d.Name || d.info || "").toUpperCase(); 
               
               const netLots = (buy - sell) / 1000;
               
               // ✨ 升級版：同時支援 FinMind V4 的英文名稱與舊版的中文名稱
               if (name.includes('FOREIGN_INVESTOR') || name.includes('外資')) {
                   fmMap[d.date].foreign += netLots;
               }
               if (name.includes('INVESTMENT_TRUST') || name.includes('投信')) {
                   fmMap[d.date].trust += netLots;
               }
               if (name.includes('DEALER') || name.includes('自營')) {
                   if (!name.includes('FOREIGN_DEALER') && !name.includes('外資自營商')) {
                       fmMap[d.date].dealer += netLots;
                   }
               }
           });
        }
        
        if (marginJson.data) {
           marginJson.data.forEach(d => {
               if (!fmMap[d.date]) fmMap[d.date] = { foreign: 0, trust: 0, dealer: 0, marginDiff: 0, shortDiff: 0 };
               fmMap[d.date].marginDiff = (Number(d.MarginPurchaseBuy || 0) - Number(d.MarginPurchaseSell || 0) - Number(d.MarginPurchaseCashRepayment || 0)) / 1000;
               fmMap[d.date].shortDiff = (Number(d.ShortSaleBuy || 0) - Number(d.ShortSaleSell || 0) - Number(d.ShortSaleCashRepayment || 0)) / 1000;
           });
        }
      } catch (fmErr) {
        console.warn("FinMind 籌碼載入失敗", fmErr);
      }

      // 3. 把籌碼資料精準對齊，塞入 Fugle 的 K 線陣列中
      const mergedCandles = candles.map(c => ({
          ...c,
          foreign: fmMap[c.date]?.foreign || 0,
          trust: fmMap[c.date]?.trust || 0,
          dealer: fmMap[c.date]?.dealer || 0,
          marginDiff: fmMap[c.date]?.marginDiff || 0,
          shortDiff: fmMap[c.date]?.shortDiff || 0
      }));

      // 將融合好的資料存入系統
      setRawDailyData(mergedCandles);
      // ==========================================
      // ✨ [FinMind 融合區塊] 結束
      // ==========================================

      setCurrentViewedSymbol(targetInput);
      setSymbolInput(''); 

    } catch (err) { 
      setError(err.message); 
      setRawDailyData(generateMockData()); 
      setCurrentViewedSymbol(targetInput); // ✨ 錯誤/測試資料也記錄
      setSymbolInput(''); 
    } finally { setLoading(false); }
  };

  // ✨ 處理載入雲端畫板的邏輯
  const handleLoadLayout = (layout) => {
    // 1. 先將畫板資料寫入本機對應的記憶體，確保圖表組件渲染時能讀到
    localStorage.setItem(`CHART_DRAWINGS_${layout.realSymbol}_${layout.timeframe}`, JSON.stringify(layout.drawings));
    
    // 2. 切換狀態 (不再設定 symbolInput)
    setTimeframe(layout.timeframe);
    
    // 3. 觸發重新抓取資料
    fetchStockData(layout.symbolFullName);
  };

  useEffect(() => { 
    if (rawDailyData.length > 0) {
        const aggregated = aggregateData(rawDailyData, timeframe);
        setKlineData(analyzeSignals(aggregated, customStrategies, issuedShares, maParams, vmaParams, indicatorParams)); 
    }
  }, [rawDailyData, timeframe, customStrategies, issuedShares, maParams, vmaParams, indicatorParams]);

  const getMetricValue = (data, index, metricDef) => {
    // ✨ 升級：取出 offset (往前推幾天)，並計算出基準日 baseIndex
    const { target, scope, n, offset } = metricDef; 
    const shift = parseInt(offset) || 0;
    const baseIndex = index - shift;
    if (baseIndex < 0) return null;

    const getValue = (idx) => {
      if (idx < 0) return null;
      if (target === 'changeRatio') return idx === 0 ? 0 : ((data[idx].close - data[idx-1].close) / data[idx-1].close) * 100;
      if (target === 'bodyRatio') return data[idx].open === 0 ? 0 : ((data[idx].close - data[idx].open) / data[idx].open) * 100;
      if (target === 'amplitude') return idx === 0 ? 0 : ((data[idx].high - data[idx].low) / data[idx-1].close) * 100;
      
      // ✨ 加入這行：支援讀取深層的指標細節 (例如把 'kd.k' 拆解開來讀取)
      if (target.includes('.')) { 
        const parts = target.split('.'); 
        return data[idx][parts[0]] ? data[idx][parts[0]][parts[1]] : null; 
      }
      
      return data[idx][target];
    };
    
    // ✨ 將原本所有的 index 都改成平移過後的 baseIndex
    if (scope === 'today') return getValue(baseIndex);
    if (scope === 'ago') { const targetIdx = baseIndex - n; return targetIdx < 0 ? null : getValue(targetIdx); }
    const numN = parseInt(n) || 1; if (baseIndex - numN + 1 < 0) return null; 
    const sliceValues = []; for (let i = baseIndex - numN + 1; i <= baseIndex; i++) sliceValues.push(getValue(i));
    if (scope === 'max') return Math.max(...sliceValues); if (scope === 'min') return Math.min(...sliceValues);
    if (scope === 'sum') return sliceValues.reduce((a, b) => a + b, 0); if (scope === 'avg') return sliceValues.reduce((a, b) => a + b, 0) / numN;
    return null;
  };
  const evaluateCondition = (data, index, condition) => {
    const leftVal = getMetricValue(data, index, condition.left); if (leftVal === null) return false;
    let rightVal;
    if (condition.rightType === 'number') rightVal = parseFloat(condition.rightNumber); 
    else {
      rightVal = getMetricValue(data, index, condition.rightMetric);
      if (rightVal !== null && condition.rightMathOp && condition.rightMathOp !== 'none') {
        const mathNum = parseFloat(condition.rightMathNum || 0);
        switch (condition.rightMathOp) { case '+': rightVal += mathNum; break; case '-': rightVal -= mathNum; break; case '*': rightVal *= mathNum; break; case '/': rightVal /= mathNum; break; }
      }
    }
    if (rightVal === null) return false;
    switch (condition.operator) { case '>': return leftVal > rightVal; case '<': return leftVal < rightVal; case '>=': return leftVal >= rightVal; case '<=': return leftVal <= rightVal; case '==': return leftVal === rightVal; case '!=': return leftVal !== rightVal; default: return false; }
  };

  const analyzeSignals = (data, customStrats, shares, maParams, vmaParams, indParams) => {
    const closes = data.map(d => d.close); const volumes = data.map(d => d.volume);
    const ma1 = calculateSMA(closes, maParams.ma1.p); const ma2 = calculateSMA(closes, maParams.ma2.p); const ma3 = calculateSMA(closes, maParams.ma3.p); 
    const vma1 = calculateSMA(volumes, vmaParams.vma1.p); const vma2 = calculateSMA(volumes, vmaParams.vma2.p); const vma3 = calculateSMA(volumes, vmaParams.vma3.p); 
    const fixedMv5 = calculateSMA(volumes, 5); const numShares = parseFloat(shares) || 0; 
    
    const bbPeriod = 20; const bbStdDev = 2; const bbMa = calculateSMA(closes, bbPeriod);
    const bbStd = data.map((d, i) => {
        if (i < bbPeriod - 1) return null;
        const slice = closes.slice(i - bbPeriod + 1, i + 1); const mean = bbMa[i];
        return Math.sqrt(slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / bbPeriod);
    });

    // ✨ 預先計算 OBV 與 OBV MA
    let obvArr = []; let currentObv = 0;
    for (let i = 0; i < data.length; i++) {
        if (i > 0) {
            if (data[i].close > data[i-1].close) currentObv += data[i].volume;
            else if (data[i].close < data[i-1].close) currentObv -= data[i].volume;
        } else { currentObv = data[i].volume; }
        obvArr.push(currentObv);
    }
    const obvMaArr = calculateSMA(obvArr, indParams.obv?.ma || 20);

    let emaFast = closes[0], emaSlow = closes[0], macdSig = 0, prevK = 50, prevD = 50;
    let gainSum1 = 0, lossSum1 = 0, avgGain1 = 0, avgLoss1 = 0, gainSum2 = 0, lossSum2 = 0, avgGain2 = 0, avgLoss2 = 0;
    let prevTowerColor = '#ef4444'; // ✨ 記錄寶塔線顏色的狀態變數

    return data.map((current, i) => {
      let volType = null, isHeidun = false, isStartTrend = false, customMarks = [];
      const turnover = numShares > 0 ? (current.volume / numShares) * 100 : 0;
      if (turnover >= 50) volType = '天量'; else if (turnover >= 10) volType = '巨量'; else if (i > 0 && fixedMv5[i-1] && current.volume >= fixedMv5[i-1] * 1.6) volType = '極限大量';

      if (i >= 2 && ma1[i] !== null) { const k1 = data[i-2], k2 = data[i-1], k3 = current; if (k1.close > k1.open && k2.close < k2.open && k2.high > k1.high && k2.low > k1.low && k3.high < k2.high && k3.close >= Math.min(k1.low, k2.low) && k3.close > ma1[i]) isHeidun = true; }
      if (i >= 14 && ma1[i] !== null) { if (current.close >= current.open && current.close > ma1[i] && current.close > data[i-1].high && current.volume > data[i-5].volume && current.volume > data[i-13].volume) isStartTrend = true; }

      if (customStrats && Array.isArray(customStrats)) {
        customStrats.forEach(strat => {
          if (!strat.isActive) return;
          const results = strat.conditions.map(cond => evaluateCondition(data, i, cond));
          if (strat.matchType === 'AND' ? results.every(r => r) : results.some(r => r)) customMarks.push(strat.marker);
        });
      }

      if (i > 0) { emaFast = current.close * (2/13) + emaFast * (1 - 2/13); emaSlow = current.close * (2/27) + emaSlow * (1 - 2/27); }
      const dif = emaFast - emaSlow; if (i === 0) macdSig = dif; else macdSig = dif * (2/10) + macdSig * (1 - 2/10);
      const osc = dif - macdSig;

      const kdPeriodData = data.slice(Math.max(0, i - indParams.kd.rsv + 1), i + 1);
      const h9 = Math.max(...kdPeriodData.map(dx => dx.high)), l9 = Math.min(...kdPeriodData.map(dx => dx.low));
      let rsv = h9 !== l9 ? ((current.close - l9) / (h9 - l9)) * 100 : 50;
      let k = (prevK * (indParams.kd.k - 1) + rsv) / indParams.kd.k, d = (prevD * (indParams.kd.d - 1) + k) / indParams.kd.d;
      prevK = k; prevD = d;

      // ✨ [新增] 威廉指標 W%R (預設 14 日週期)
      const wrPeriodData = data.slice(Math.max(0, i - 14 + 1), i + 1);
      const wrH = Math.max(...wrPeriodData.map(dx => dx.high)), wrL = Math.min(...wrPeriodData.map(dx => dx.low));
      const willr = wrH !== wrL ? ((wrH - current.close) / (wrH - wrL)) * -100 : 0;

      let rsi1 = null, rsi2 = null;
      if (i > 0) {
        const gain = Math.max(0, current.close - closes[i - 1]), loss = Math.max(0, closes[i - 1] - current.close);
        if (i <= indParams.rsi.p1) { avgGain1 = (gainSum1+=gain)/i; avgLoss1 = (lossSum1+=loss)/i; } else { avgGain1 = (avgGain1*(indParams.rsi.p1-1)+gain)/indParams.rsi.p1; avgLoss1 = (avgLoss1*(indParams.rsi.p1-1)+loss)/indParams.rsi.p1; }
        rsi1 = avgLoss1 === 0 ? 100 : 100 - (100 / (1 + (avgGain1 / avgLoss1)));
        if (i <= indParams.rsi.p2) { avgGain2 = (gainSum2+=gain)/i; avgLoss2 = (lossSum2+=loss)/i; } else { avgGain2 = (avgGain2*(indParams.rsi.p2-1)+gain)/indParams.rsi.p2; avgLoss2 = (avgLoss2*(indParams.rsi.p2-1)+loss)/indParams.rsi.p2; }
        rsi2 = avgLoss2 === 0 ? 100 : 100 - (100 / (1 + (avgGain2 / avgLoss2)));
      }

      let bbUp = null, bbMid = bbMa[i], bbDown = null; 
      let bbUp3 = null, bbDown3 = null; // ✨ 新增：高布林參數
      if (bbStd[i] !== null) { 
        bbUp = bbMid + bbStdDev * bbStd[i]; 
        bbDown = bbMid - bbStdDev * bbStd[i]; 
        bbUp3 = bbMid + 3.0 * bbStd[i]; // ✨ 3.0倍 高布林上軌
        bbDown3 = bbMid - 3.0 * bbStd[i]; // ✨ 3.0倍 高布林下軌
      }
      
      // ✨ 寶塔線 N 日參數運算邏輯 (修正版)
      const towerP = indParams.tower?.p || 3;
      let tColor = prevTowerColor;
      let tTop = current.close;
      let tBottom = current.open; // 針對第一天的預設

      if (i > 0) { 
        const prevClose = data[i-1].close;
        // ✨ 正確畫法：積木方塊是畫在「昨收」與「今收」之間
        tTop = Math.max(current.close, prevClose);
        tBottom = Math.min(current.close, prevClose);
        
        // 取得前 N 天的最高/最低收盤價
        const lookbackData = data.slice(Math.max(0, i - towerP), i);
        const refHigh = Math.max(...lookbackData.map(dx => dx.close));
        const refLow = Math.min(...lookbackData.map(dx => dx.close));
        
        // 判斷是否翻色
        if (current.close > refHigh) tColor = '#ef4444';
        else if (current.close < refLow) tColor = '#22c55e';
        else tColor = prevTowerColor; // 沒有突破就維持昨天的顏色
      } else {
        tColor = current.close >= current.open ? '#ef4444' : '#22c55e';
      }
      
      prevTowerColor = tColor; // 把今天的顏色存起來，留給明天判斷用
      let tower = { top: tTop, bottom: tBottom, color: tColor };

      return { 
          ...current, ma1: ma1[i], ma2: ma2[i], ma3: ma3[i], vma1: vma1[i], vma2: vma2[i], vma3: vma3[i], 
          signalVol: volType, signalHeidun: isHeidun, signalTrend: isStartTrend ? '起漲K' : null, customMarks,
          macd: { dif, macd: macdSig, osc }, kd: { k, d }, rsi: { rsi1, rsi2 },　willr,
          obv: obvArr[i], obvMa: obvMaArr[i], bbands: { up: bbUp, mid: bbMid, down: bbDown, up3: bbUp3, down3: bbDown3 }, tower 
      };
    });
  };

  const calculateSMA = (arr, period) => arr.map((val, idx) => idx < period - 1 ? null : arr.slice(idx - period + 1, idx + 1).reduce((a, b) => a + b, 0) / period);
  const addCondition = () => setDraftStrategy(prev => ({ ...prev, conditions: [...prev.conditions, { left: { target: 'volume', scope: 'today', n: 1 }, operator: '>=', rightType: 'metric', rightMetric: { target: 'volume', scope: 'ago', n: 1 }, rightMathOp: '*', rightMathNum: 2, rightNumber: 100 }] }));
  const updateCondition = (index, field, value) => { setDraftStrategy(prev => { const newConds = [...prev.conditions]; if (field.includes('.')) { const [obj, key] = field.split('.'); newConds[index][obj] = { ...newConds[index][obj], [key]: value }; } else newConds[index][field] = value; return { ...prev, conditions: newConds }; }); };
  const removeCondition = (index) => setDraftStrategy(prev => ({ ...prev, conditions: prev.conditions.filter((_, i) => i !== index) }));
  
  const saveStrategy = () => { 
    if (draftStrategy.name.trim() === '') return showAlert('請輸入策略名稱'); 
    if (draftStrategy.marker.trim() === '') return showAlert('請輸入或選擇標記'); 
    setCustomStrategies(prev => [...prev, { ...draftStrategy, id: Date.now(), isActive: true }]); 
    setIsBuilderOpen(false); 
  };

  let globalDefensivePrice = null;
  if (klineData.length > 0) {
    for (let i = klineData.length - 1; i >= 0; i--) {
      if (klineData[i].signalVol === '天量' || klineData[i].signalVol === '巨量') { globalDefensivePrice = klineData[i].low * 0.9; break; }
    }
  }

  // ==========================================
  // ✨ [新增] 自選股策略掃描引擎
  // ==========================================
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [scanResults, setScanResults] = useState({});
  const [selectedScanStrategy, setSelectedScanStrategy] = useState('');

  const handleScanWatchlist = async (strategyId) => {
    if (!strategyId) return showAlert('請先選擇一個自訂策略！');
    if (watchlist.length === 0) return showAlert('您的自選名單空空如也，請先加入股票！');

    const strategy = customStrategies.find(s => s.id.toString() === strategyId.toString());
    if (!strategy) return;

    setIsScanning(true);
    setScanProgress({ current: 0, total: watchlist.length });
    const results = {};

    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - 150); // 抓 150 天的資料供 MA 等指標計算
    const fromDateStr = fromDate.toISOString().split('T')[0];
    const toDateStr = toDate.toISOString().split('T')[0];

    for (let i = 0; i < watchlist.length; i++) {
      const stock = watchlist[i];
      try {
        // 1. 抓取富果 K 線
        const histUrl = `https://api.fugle.tw/marketdata/v1.0/stock/historical/candles/${stock.symbol}?timeframe=D&from=${fromDateStr}&to=${toDateStr}`;
        const histRes = await fetch(histUrl, { headers: { 'X-API-KEY': userApiKey } });
        if (!histRes.ok) throw new Error('Fugle API 異常');
        const histData = await histRes.json();
        let candles = histData.data.reverse().map(d => ({ date: d.date, open: d.open, high: d.high, low: d.low, close: d.close, volume: Math.round(d.volume / 1000) }));

        // 2. 抓取 FinMind 籌碼 (若有金鑰)
        const fmMap = {};
        if (finmindApiKey) {
           const [instRes, marginRes] = await Promise.all([
              fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockInstitutionalInvestorsBuySell&data_id=${stock.symbol}&start_date=${fromDateStr}&token=${finmindApiKey}`),
              fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockMarginPurchaseShortSale&data_id=${stock.symbol}&start_date=${fromDateStr}&token=${finmindApiKey}`)
           ]);
           const instJson = await instRes.json();
           const marginJson = await marginRes.json();

           if (instJson.data) {
               instJson.data.forEach(d => {
                   if (!fmMap[d.date]) fmMap[d.date] = { foreign: 0, trust: 0, dealer: 0, marginDiff: 0, shortDiff: 0 };
                   const buy = Number(d.buy || d.Buy || d.buy_vol || 0);
                   const sell = Number(d.sell || d.Sell || d.sell_vol || 0);
                   const name = String(d.name || d.Name || d.info || "").toUpperCase();
                   const netLots = (buy - sell) / 1000;
                   if (name.includes('FOREIGN_INVESTOR') || name.includes('外資')) fmMap[d.date].foreign += netLots;
                   if (name.includes('INVESTMENT_TRUST') || name.includes('投信')) fmMap[d.date].trust += netLots;
                   if (name.includes('DEALER') || name.includes('自營')) {
                       if (!name.includes('FOREIGN_DEALER') && !name.includes('外資自營商')) fmMap[d.date].dealer += netLots;
                   }
               });
           }
           if (marginJson.data) {
               marginJson.data.forEach(d => {
                   if (!fmMap[d.date]) fmMap[d.date] = { foreign: 0, trust: 0, dealer: 0, marginDiff: 0, shortDiff: 0 };
                   fmMap[d.date].marginDiff = (Number(d.MarginPurchaseBuy || 0) - Number(d.MarginPurchaseSell || 0) - Number(d.MarginPurchaseCashRepayment || 0)) / 1000;
                   fmMap[d.date].shortDiff = (Number(d.ShortSaleBuy || 0) - Number(d.ShortSaleSell || 0) - Number(d.ShortSaleCashRepayment || 0)) / 1000;
               });
           }
        }

        // 3. 組合資料並用引擎運算
        const mergedCandles = candles.map(c => ({
            ...c,
            foreign: fmMap[c.date]?.foreign || 0,
            trust: fmMap[c.date]?.trust || 0,
            dealer: fmMap[c.date]?.dealer || 0,
            marginDiff: fmMap[c.date]?.marginDiff || 0,
            shortDiff: fmMap[c.date]?.shortDiff || 0
        }));

        // 把選定的策略「強制啟用」送進去算
        const testStrats = [{...strategy, isActive: true}];
        const testKlineData = analyzeSignals(mergedCandles, testStrats, 0, maParams, vmaParams, indicatorParams);
        
        // 4. 驗證最後一根 K 棒是否出現標記
        const lastCandle = testKlineData[testKlineData.length - 1];
        if (lastCandle && lastCandle.customMarks && lastCandle.customMarks.includes(strategy.marker)) {
            results[stock.symbol] = true;
        } else {
            results[stock.symbol] = false;
        }

      } catch (err) {
         console.warn(`掃描失敗: ${stock.symbol}`, err);
         results[stock.symbol] = false;
      }

      setScanProgress({ current: i + 1, total: watchlist.length });
      setScanResults({...results}); // 讓畫面即時更新進度
      await new Promise(r => setTimeout(r, 400)); // ⏳ 延遲 0.4 秒，防止 API 抓太快被鎖
    }

    setIsScanning(false);
  };

  // ✨ 等待雲端資料載入畫面
  if (!dbLoaded) {
    return (
      <div className="min-h-screen bg-[#020617] text-cyan-400 flex items-center justify-center p-4">
         <div className="flex flex-col items-center gap-4 animate-pulse">
            <span className="text-4xl">☁️</span>
            <span className="font-bold tracking-widest text-lg text-cyan-300">正在從雲端載入您的專屬設定...</span>
         </div>
      </div>
    );
  }

  if (showKeySetup) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-300 flex items-center justify-center p-4 relative z-[999]">
        <div className="bg-[#0f172a] p-6 sm:p-8 rounded-2xl shadow-[0_0_40px_rgba(8,145,178,0.2)] max-w-lg w-full border border-cyan-900">
          <div className="flex justify-center mb-6">
            <img 
              src="https://lh3.googleusercontent.com/d/1Non2p5IUFcBtKWqq0P8LulQo-Df83ivk" 
              alt="一直畫 Logo" 
              className="h-16 w-auto object-contain rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]" 
              onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
            />
          </div>
          <h1 className="text-2xl font-bold text-center text-cyan-400 mb-2 tracking-wider">一直畫 策略股寶寶</h1>
          <p className="text-center text-slate-400 font-bold mb-8 bg-slate-800/50 py-1 rounded border border-slate-700/50">高階版 (Pro Version)</p>
          <div className="mb-6 space-y-4">
            <p className="text-slate-400 text-sm leading-relaxed">為了確保您的資料安全與隱私，系統採用本機直接連線。您需要輸入專屬於您的 <span className="font-bold text-cyan-400">API 金鑰</span> 來啟用高階看盤功能。</p>
            <div className="bg-amber-950/30 border border-amber-900/50 text-amber-500 text-xs p-3 rounded-lg flex gap-2"><span className="text-lg">🛡️</span><p>您的金鑰 <strong className="text-amber-400">只會加密儲存在您當下使用的瀏覽器中 (Local Storage)</strong>，絕對不會上傳伺服器。</p></div>
            <div className="pt-2">
              <label className="block text-sm font-bold text-cyan-500 mb-2">1. 請貼上您的金鑰1：</label>
              <input type="password" value={tempKey} onChange={(e) => setTempKey(e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-cyan-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono shadow-inner text-cyan-300 mb-4" placeholder="例如: YzljZDBlYzYt..." />
              
              <label className="block text-sm font-bold text-pink-500 mb-2">2. 請貼上您的金鑰2 (用於籌碼)：</label>
              <input type="password" value={tempFmKey} onChange={(e) => setTempFmKey(e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-pink-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 font-mono shadow-inner text-pink-300" placeholder="例如: abc123def456..." />
            </div>

          </div>
          <div className="flex gap-3">
            {userApiKey && <button onClick={() => setShowKeySetup(false)} className="flex-1 px-4 py-3 rounded-lg font-bold text-slate-400 bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors">取消</button>}
            <button onClick={handleSaveKey} className="flex-1 px-4 py-3 rounded-lg font-bold text-slate-900 bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">啟動系統 🚀</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] p-2 sm:p-4 font-sans text-slate-300 pb-20 selection:bg-cyan-900/50 flex flex-col gap-3 overflow-hidden">
      <CustomModal modal={appModal} />
      <datalist id="stock-list">{STOCKS.map(s => <option key={s.id} value={`${s.id} ${s.name}`} />)}</datalist>

      {/* ========================================== */}
      {/* 🌟 頂部：核心搜尋與操作列 (包含固定側邊欄) */}
      {/* ========================================== */}
      <div className="bg-[#0f172a] rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.1)] border border-cyan-900/50 flex items-center overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] relative h-[72px]">
        
        {/* 🌟 固定的最左側：Logo + 金鑰 + 股號 + 抓K線 + 週期 */}
        <div className="sticky left-0 bg-[#0f172a] z-30 flex items-center border-r border-cyan-900/50 h-full shrink-0 shadow-[4px_0_15px_rgba(0,0,0,0.3)]">
          <div className="px-3 py-1 flex flex-col items-center justify-center border-r border-slate-700/50 gap-1 h-full shrink-0">
            <img 
              src="https://lh3.googleusercontent.com/d/1Non2p5IUFcBtKWqq0P8LulQo-Df83ivk" 
              alt="Logo" 
              className="h-[28px] w-auto object-contain rounded-full shadow-[0_0_10px_rgba(6,182,212,0.4)]" 
              onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
            />
            <button onClick={() => setShowKeySetup(true)} className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-200 font-bold bg-slate-800 border border-cyan-900 px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(8,145,178,0.3)] transition-colors">
              <span>🔑</span> 金鑰設定
            </button>
          </div>
          
          <div className="flex items-center gap-0.25 px-0.5 shrink-0">
            {/* ✨ 更新 placeholder，若有當前股號就會提示在此 */}
            <input type="text" list="stock-list" value={symbolInput} onChange={(e) => setSymbolInput(e.target.value)} className="px-3 py-1.5 border border-cyan-800 bg-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 w-20 sm:w-24 font-bold text-center text-sm text-cyan-300 placeholder-slate-600 shadow-inner shrink-0" placeholder={currentViewedSymbol ? displayFullname : "股號/股名"} onKeyDown={(e) => e.key === 'Enter' && fetchStockData()} />
            

            <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="px-2 py-1.5 border border-cyan-800 bg-slate-900 rounded-lg text-sm font-bold text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer shadow-inner shrink-0">
              <option value="D">日</option><option value="W">週</option><option value="M">月</option>
            </select>

              <button onClick={() => fetchStockData()} disabled={loading} className="bg-cyan-700 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-cyan-600 disabled:opacity-50 text-sm whitespace-nowrap shadow-[0_0_15px_rgba(8,145,178,0.4)] flex items-center gap-1 transition-all shrink-0">K</button>
          </div>
        </div>

        {/* 🌟 可滾動的右側區域：流通張數 + 策略 + 產業工具 */}
        <div className="flex items-center gap-2.5 px-3 py-2 shrink-0 h-full">
          <div className="relative flex items-center shrink-0">
            <input type="number" value={issuedShares} onChange={(e) => setIssuedShares(e.target.value)} className="px-3 py-1.5 border border-amber-900/50 bg-amber-950/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 w-28 font-mono text-left text-sm text-amber-400 placeholder-amber-700/50 pr-16 shadow-inner" placeholder="流通張數" />
            <div className="absolute right-1 flex items-center gap-1">
              <button onClick={handleManualSearch} className="text-base hover:scale-110 cursor-pointer" title="手動Google查詢">🔍</button>
              <button onClick={fetchSharesFromAI} disabled={aiLoading} className="text-base hover:scale-110 cursor-pointer" title="AI自動查詢">{aiLoading ? '⏳' : '✨'}</button>
            </div>
          </div>

          <div className="w-[1px] h-6 bg-slate-700 mx-1 shrink-0"></div>
          {/* ✨ 1. 快捷開啟排行連結 */}
          <button onClick={() => window.open('https://fubon-ebrokerdj.fbs.com.tw/Z/ZG/ZG_A.djhtm', '_blank')} className="shrink-0 justify-center bg-blue-900/40 border border-blue-700 text-blue-300 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold shadow-[0_0_10px_rgba(59,130,246,0.2)] hover:bg-blue-800 whitespace-nowrap transition-all flex items-center">
            🔗 排行截圖點
          </button>
          
          {/* ✨ 2. AI 讀圖上傳按鈕 
          <div className="relative inline-block h-full shrink-0">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
              disabled={isLoadingRanking}
            />
            <div className={`h-full flex justify-center items-center px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${isLoadingRanking ? 'bg-purple-900/30 text-purple-500 border border-purple-800' : 'bg-purple-900/50 border border-purple-700 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)] hover:bg-purple-800'}`}>
              {isLoadingRanking ? '⏳ 處理中' : '📸 上傳截圖'}
            </div>
          </div>*/}

          {/* ✨ 2.5 手動貼上排行按鈕 */}
          <button onClick={() => setIsPasteModalOpen(true)} className="shrink-0 justify-center bg-emerald-900/40 border border-emerald-700 text-emerald-300 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)] hover:bg-emerald-800 whitespace-nowrap transition-all flex items-center">
            📝 貼上排行
          </button>

          <div className="w-[1px] h-6 bg-slate-700 mx-1 shrink-0"></div>
          {/* 面板控制按鈕 */}
          <button onClick={() => setIsBuilderOpen(!isBuilderOpen)} className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors shrink-0 ${isBuilderOpen ? 'bg-teal-900/60 text-teal-300 border-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.4)]' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-teal-400'}`}>🧪策略</button>

        </div>
      </div>

      {/* ========================================== */}
      {/* 🌟 佈局：左側 (K線圖+面板) | 右側 (產業工具) */}
      {/* ========================================== */}
      <div className="max-w-[1600px] w-full mx-auto grid grid-cols-1 xl:grid-cols-12 gap-5 mt-2 flex-1 min-h-0">
        
        {/* 左側：主看盤區 + 均線控制面板 (佔 10 格) */}
        <div className="xl:col-span-10 flex flex-col h-full min-h-[500px]">
          
          {/* ✨ 新增的折疊面板 (圖表與均線設定) */}
          <Panel title="圖表技術指標與策略設定" icon="🎛️" isOpen={panelsOpen.config} onToggle={() => setPanelsOpen(p => ({...p, config: !p.config}))}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700/50 pb-1">K BARS 數量與均線 (MA / VMA)</span>
                <div className="flex flex-col gap-2 mt-1">
                  {[1, 2, 3].map(n => (
                    <div key={`ma-${n}`} className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50 shadow-inner">
                      <input type="checkbox" checked={maParams[`ma${n}`].show !== false} onChange={e => setMaParams({...maParams, [`ma${n}`]: {...maParams[`ma${n}`], show: e.target.checked}})} className="w-3.5 h-3.5 text-cyan-500 rounded bg-slate-900 border-slate-600 shrink-0 cursor-pointer" />
                      <input type="color" value={maParams[`ma${n}`].c} onChange={e => setMaParams({...maParams, [`ma${n}`]: {...maParams[`ma${n}`], c: e.target.value}})} className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent shrink-0" />
                      <span className="text-[10px] text-slate-400 font-bold w-8 shrink-0">MA {n}</span>
                      <input type="number" value={maParams[`ma${n}`].p} onChange={e => setMaParams({...maParams, [`ma${n}`]: {...maParams[`ma${n}`], p: Number(e.target.value)}})} className="w-10 p-0.5 text-center text-sm font-bold bg-slate-900 rounded border border-slate-700 outline-none shrink-0" style={{color: maParams[`ma${n}`].c}} />
                      <select value={maParams[`ma${n}`].w} onChange={e => setMaParams({...maParams, [`ma${n}`]: {...maParams[`ma${n}`], w: Number(e.target.value)}})} className="flex-1 p-0.5 bg-slate-900 border border-slate-700 text-slate-300 text-[10px] rounded cursor-pointer">
                        <option value={1}>細 1px</option><option value={1.5}>中 1.5px</option><option value={2.5}>粗 2.5px</option>
                      </select>
                    </div>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700/50 pb-1 mt-2">均量線 (VMA)</span>
                <div className="flex flex-col gap-2 mt-1">
                  {[1, 2, 3].map(n => (
                    <div key={`vma-${n}`} className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50 shadow-inner">
                      <input type="checkbox" checked={vmaParams[`vma${n}`].show !== false} onChange={e => setVmaParams({...vmaParams, [`vma${n}`]: {...vmaParams[`vma${n}`], show: e.target.checked}})} className="w-3.5 h-3.5 text-cyan-500 rounded bg-slate-900 border-slate-600 shrink-0 cursor-pointer" />
                      <input type="color" value={vmaParams[`vma${n}`].c} onChange={e => setVmaParams({...vmaParams, [`vma${n}`]: {...vmaParams[`vma${n}`], c: e.target.value}})} className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent shrink-0" />
                      <span className="text-[10px] text-slate-400 font-bold w-8 shrink-0">VMA {n}</span>
                      <input type="number" value={vmaParams[`vma${n}`].p} onChange={e => setVmaParams({...vmaParams, [`vma${n}`]: {...vmaParams[`vma${n}`], p: Number(e.target.value)}})} className="w-10 p-0.5 text-center text-sm font-bold bg-slate-900 rounded border border-slate-700 outline-none shrink-0" style={{color: vmaParams[`vma${n}`].c}} />
                      <select value={vmaParams[`vma${n}`].w} onChange={e => setVmaParams({...vmaParams, [`vma${n}`]: {...vmaParams[`vma${n}`], w: Number(e.target.value)}})} className="flex-1 p-0.5 bg-slate-900 border border-slate-700 text-slate-300 text-[10px] rounded cursor-pointer">
                        <option value={1}>細 1px</option><option value={1.5}>中 1.5px</option><option value={2.5}>粗 2.5px</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700/50 pb-1">圖表訊號與自訂策略</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  <label className="flex items-center gap-1.5 cursor-pointer bg-slate-800/50 px-2 py-1 rounded border border-slate-700 hover:bg-slate-700 transition-colors"><input type="checkbox" checked={toggles.showMA} onChange={() => handleToggle('showMA')} className="w-3.5 h-3.5 text-cyan-500 rounded bg-slate-900 border-slate-600" /><span className="text-xs text-slate-300">均線總開關</span></label>
                  <label className="flex items-center gap-1.5 cursor-pointer bg-slate-800/50 px-2 py-1 rounded border border-slate-700 hover:bg-slate-700 transition-colors"><input type="checkbox" checked={toggles.showVolume} onChange={() => handleToggle('showVolume')} className="w-3.5 h-3.5 text-cyan-500 rounded bg-slate-900 border-slate-600" /><span className="text-xs text-slate-300">均量線總開關</span></label>
                  <label className="flex items-center gap-1.5 cursor-pointer bg-slate-800/50 px-2 py-1 rounded border border-slate-700 hover:bg-slate-700 transition-colors"><input type="checkbox" checked={toggles.showBBands} onChange={() => handleToggle('showBBands')} className="w-3.5 h-3.5 text-purple-500 rounded bg-slate-900 border-slate-600" /><span className="text-xs text-purple-400 font-bold">布林通道</span></label>
                  {/* ✨ 新增：高布林(3.0) 打勾按鈕 */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-slate-800/50 px-2 py-1 rounded border border-slate-700 hover:bg-slate-700 transition-colors"><input type="checkbox" checked={toggles.showBBands3} onChange={() => handleToggle('showBBands3')} className="w-3.5 h-3.5 text-pink-500 rounded bg-slate-900 border-slate-600" /><span className="text-xs text-pink-400 font-bold">高布林(3.0)</span></label>
                  <label className="flex items-center gap-1.5 cursor-pointer bg-slate-800/50 px-2 py-1 rounded border border-slate-700 hover:bg-slate-700 transition-colors"><input type="checkbox" checked={toggles.showCrosshair !== false} onChange={() => handleToggle('showCrosshair')} className="w-3.5 h-3.5 text-pink-500 rounded bg-slate-900" /><span className="text-xs text-pink-400 font-bold">查價線</span></label>                  
                  {/* ✨ 新增：布林壓縮(0.15%) 打勾按鈕 */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-slate-800/50 px-2 py-1 rounded border border-slate-700 hover:bg-slate-700 transition-colors"><input type="checkbox" checked={toggles.showBBandsCompress} onChange={() => handleToggle('showBBandsCompress')} className="w-3.5 h-3.5 text-yellow-500 rounded bg-slate-900 border-slate-600" /><span className="text-xs text-yellow-400 font-bold">布林壓縮</span></label>
                  {/* ✨ 新增：詳細資訊分流勾選鍵 */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-slate-800/50 px-2 py-1 rounded border border-slate-700 hover:bg-slate-700 transition-colors"><input type="checkbox" checked={toggles.showTooltipDetail} onChange={() => handleToggle('showTooltipDetail')} className="w-3.5 h-3.5 text-amber-500 rounded bg-slate-900 border-slate-600" /><span className="text-xs text-amber-400 font-bold">查價詳細資訊</span></label>
                  
                  {/* ✨ 補回：量能標記、起漲、黑頓 */}
                  <label className="flex items-center gap-1.5 cursor-pointer bg-slate-800/50 px-2 py-1 rounded border border-slate-700 hover:bg-slate-800 transition-colors"><input type="checkbox" checked={toggles.showVolSignal} onChange={() => handleToggle('showVolSignal')} className="w-3.5 h-3.5 text-cyan-500 rounded bg-slate-900 border-slate-600" /><span className="text-xs text-slate-300">量能標記</span></label>
                  <label className="flex items-center gap-1.5 cursor-pointer bg-slate-800/50 px-2 py-1 rounded border border-slate-700 hover:bg-slate-800 transition-colors"><input type="checkbox" checked={toggles.showTrend} onChange={() => handleToggle('showTrend')} className="w-3.5 h-3.5 text-emerald-500 rounded bg-slate-900 border-slate-600" /><span className="text-xs text-emerald-400 font-bold">🔺起漲</span></label>
                  <label className="flex items-center gap-1.5 cursor-pointer bg-slate-800/50 px-2 py-1 rounded border border-slate-700 hover:bg-slate-800 transition-colors"><input type="checkbox" checked={toggles.showHeidun} onChange={() => handleToggle('showHeidun')} className="w-3.5 h-3.5 text-cyan-500 rounded bg-slate-900 border-slate-600" /><span className="text-xs text-slate-400 font-bold">黑頓</span></label>
                </div>

                {/* ✨ 補回：自訂策略 (天機K) */}
                {customStrategies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {customStrategies.map(strat => (
                      <div key={strat.id} className="flex items-center gap-1 bg-indigo-950/30 px-2 py-1 rounded border border-indigo-900/50">
                        <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={strat.isActive} onChange={() => handleCustomToggle(strat.id)} className="w-3.5 h-3.5 text-indigo-500 rounded border-slate-600 bg-slate-900" /><span className="text-xs font-bold text-indigo-300">{strat.marker} {strat.name}</span></label>
                        <button onClick={() => deleteCustomStrategy(strat.id)} className="text-indigo-500 hover:text-red-400 ml-1 font-bold text-[10px]">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 mt-4 pt-4 border-t border-slate-700/50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0 mt-2">副圖指標：</span>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  {['None', 'MACD', 'KD', 'RSI', 'OBV', 'TOWER', '外資', '投信', '自營', '投+外', '資券'].map(type => (
                    <button key={type} onClick={() => setIndicatorType(type)} className={`px-3 py-1.5 text-xs rounded font-bold ${indicatorType === type ? 'bg-cyan-700 text-white border border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                      {type === 'None' ? '關閉' : (type === 'TOWER' ? '寶塔線' : type)}
                    </button>
                  ))}
                </div>
                {/* 動態參數調整輸入框 */}
                {indicatorType === 'MACD' && (
                  <div className="flex flex-wrap items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 w-fit">
                    <span className="text-[10px] text-slate-400 font-bold">快線</span>
                    <input type="number" value={indicatorParams.macd.fast} onChange={e => setIndicatorParams({...indicatorParams, macd: {...indicatorParams.macd, fast: Number(e.target.value)}})} className="w-10 bg-slate-900 border border-slate-700 rounded text-cyan-300 text-xs text-center outline-none focus:border-cyan-500" />
                    <span className="text-[10px] text-slate-400 font-bold ml-2">慢線</span>
                    <input type="number" value={indicatorParams.macd.slow} onChange={e => setIndicatorParams({...indicatorParams, macd: {...indicatorParams.macd, slow: Number(e.target.value)}})} className="w-10 bg-slate-900 border border-slate-700 rounded text-cyan-300 text-xs text-center outline-none focus:border-cyan-500" />
                    <span className="text-[10px] text-slate-400 font-bold ml-2">訊號線</span>
                    <input type="number" value={indicatorParams.macd.signal} onChange={e => setIndicatorParams({...indicatorParams, macd: {...indicatorParams.macd, signal: Number(e.target.value)}})} className="w-10 bg-slate-900 border border-slate-700 rounded text-cyan-300 text-xs text-center outline-none focus:border-cyan-500" />
                  </div>
                )}
                {indicatorType === 'KD' && (
                  <div className="flex flex-wrap items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 w-fit">
                    <span className="text-[10px] text-slate-400 font-bold">RSV 週期</span>
                    <input type="number" value={indicatorParams.kd.rsv} onChange={e => setIndicatorParams({...indicatorParams, kd: {...indicatorParams.kd, rsv: Number(e.target.value)}})} className="w-10 bg-slate-900 border border-slate-700 rounded text-cyan-300 text-xs text-center outline-none focus:border-cyan-500" />
                    <span className="text-[10px] text-slate-400 font-bold ml-2">K 平滑</span>
                    <input type="number" value={indicatorParams.kd.k} onChange={e => setIndicatorParams({...indicatorParams, kd: {...indicatorParams.kd, k: Number(e.target.value)}})} className="w-10 bg-slate-900 border border-slate-700 rounded text-cyan-300 text-xs text-center outline-none focus:border-cyan-500" />
                    <span className="text-[10px] text-slate-400 font-bold ml-2">D 平滑</span>
                    <input type="number" value={indicatorParams.kd.d} onChange={e => setIndicatorParams({...indicatorParams, kd: {...indicatorParams.kd, d: Number(e.target.value)}})} className="w-10 bg-slate-900 border border-slate-700 rounded text-cyan-300 text-xs text-center outline-none focus:border-cyan-500" />
                  </div>
                )}
                {indicatorType === 'RSI' && (
                  <div className="flex flex-wrap items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 w-fit">
                    <span className="text-[10px] text-slate-400 font-bold">短週期 (RSI 1)</span>
                    <input type="number" value={indicatorParams.rsi.p1} onChange={e => setIndicatorParams({...indicatorParams, rsi: {...indicatorParams.rsi, p1: Number(e.target.value)}})} className="w-10 bg-slate-900 border border-slate-700 rounded text-cyan-300 text-xs text-center outline-none focus:border-cyan-500" />
                    <span className="text-[10px] text-slate-400 font-bold ml-2">長週期 (RSI 2)</span>
                    <input type="number" value={indicatorParams.rsi.p2} onChange={e => setIndicatorParams({...indicatorParams, rsi: {...indicatorParams.rsi, p2: Number(e.target.value)}})} className="w-10 bg-slate-900 border border-slate-700 rounded text-cyan-300 text-xs text-center outline-none focus:border-cyan-500" />
                  </div>
                )}
                {indicatorType === 'OBV' && (
                  <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 w-fit">
                    <span className="text-[10px] text-slate-400 font-bold">OBV MA週期</span>
                    <input type="number" value={indicatorParams.obv?.ma || 20} onChange={e => setIndicatorParams({...indicatorParams, obv: {...indicatorParams.obv, ma: Number(e.target.value)}})} className="w-10 bg-slate-900 border border-slate-700 rounded text-cyan-300 text-xs text-center outline-none focus:border-cyan-500" />
                  </div>
                )}
                {indicatorType === 'TOWER' && (
                  <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 w-fit">
                    <span className="text-[10px] text-slate-400 font-bold">寶塔線參數 (N日)</span>
                    <input type="number" value={indicatorParams.tower?.p || 3} onChange={e => setIndicatorParams({...indicatorParams, tower: {...indicatorParams.tower, p: Number(e.target.value)}})} className="w-10 bg-slate-900 border border-slate-700 rounded text-cyan-300 text-xs text-center outline-none focus:border-cyan-500" />
                  </div>
                )}
              </div>
            </div>
          </Panel>

          {error && <div className="bg-red-950/50 text-red-400 font-bold border border-red-900/50 p-4 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.2)] mb-2 shrink-0">{error}</div>}
          
          {klineData.length > 0 ? (
            <div className="flex-1 w-full h-full relative">
              <TrendChart 
                data={klineData} // ✨ 不再切斷，傳入全部資料，讓畫布可以無限往左滑！ 
                timeframe={timeframe}
                stockName={displayFullname} 
                toggles={toggles}
                onToggleCrosshair={() => handleToggle('showCrosshair')} 
                customStrategies={customStrategies} 
                maParams={maParams}
                vmaParams={vmaParams}
                defensivePrice={globalDefensivePrice}
                realSymbol={currentRealSymbol} // ✨ 修正：傳入分離出來的真實股號，防止存檔存到空字串
                displayCount={displayCount}
                indicatorType={indicatorType}
                indicatorParams={indicatorParams}
                setDisplayCount={setDisplayCount}
                totalDataLength={klineData.length}
                savedLayouts={savedLayouts}        // ✨ 傳入畫板資料
                setSavedLayouts={setSavedLayouts}  // ✨ 傳入更新畫板的方法
                onLoadLayout={handleLoadLayout}    // ✨ 傳入載入畫板的方法
                rankingList={rankingList}
                onOpenRanking={() => setIsRankingOpen(true)}
                rankingModalContent={
                  /* ✨ 🏆 專業雙頁籤選股清單視窗 (升級版：保留捲動位置) */
                  (() => {
                    // 先決定現在要顯示哪個清單，並套用排序魔法
                    const currentList = rankingTab === 'ranking' ? rankingList : watchlist;
                    const displayData = getSortedData(currentList);

                    return (
                      <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-2 sm:px-4 transition-all duration-200 ${isRankingOpen ? 'visible opacity-100 pointer-events-auto' : 'invisible opacity-0 pointer-events-none'}`}>
                        <div className={`bg-slate-900 border border-slate-700 rounded-xl shadow-[0_0_40px_rgba(168,85,247,0.3)] w-full max-w-lg overflow-hidden flex flex-col h-[85vh] sm:h-[75vh] transition-transform duration-200 ${isRankingOpen ? 'scale-100' : 'scale-95'}`}>
                          
                          {/* 頂部控制列 */}
                          <div className="flex justify-between items-center p-3 border-b border-slate-700 bg-slate-800 shrink-0">
                            <h3 className="text-purple-400 font-bold text-lg flex items-center gap-2"><span>📋</span> 選股中心</h3>
                            <button onClick={() => setIsRankingOpen(false)} className="text-slate-400 hover:text-white bg-slate-900 px-3 py-1 rounded border border-slate-700">✕ 關閉</button>
                          </div>

                          {/* 雙頁籤切換 */}
                          <div className="flex bg-slate-800 border-b border-slate-700 shrink-0">
                            <button onClick={() => setRankingTab('ranking')} className={`flex-1 py-3 font-bold transition-all ${rankingTab === 'ranking' ? 'text-cyan-300 border-b-2 border-cyan-400 bg-slate-700/50' : 'text-slate-500 hover:bg-slate-700/30'}`}>
                              🏆 AI 讀圖名單 ({rankingList.length})
                            </button>
                            <button onClick={() => setRankingTab('watchlist')} className={`flex-1 py-3 font-bold transition-all ${rankingTab === 'watchlist' ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-700/50' : 'text-slate-500 hover:bg-slate-700/30'}`}>
                              ⭐ 我的自選 ({watchlist.length})
                            </button>
                          </div>

                          {/* ✨ [新增] 自選股的策略掃描控制列 */}
                          {rankingTab === 'watchlist' && (
                            <div className="p-2 sm:p-3 bg-slate-800/80 border-b border-slate-700 flex flex-col sm:flex-row items-center gap-2 shrink-0">
                              <span className="text-slate-400 font-bold text-sm shrink-0">🔍 掃描自選股：</span>
                              <select 
                                className="bg-slate-900 border border-slate-600 text-cyan-300 px-2 py-1.5 rounded outline-none font-bold text-sm flex-1 w-full"
                                value={selectedScanStrategy}
                                onChange={(e) => setSelectedScanStrategy(e.target.value)}
                                disabled={isScanning}
                              >
                                <option value="">-- 選擇您的自訂策略 --</option>
                                {customStrategies.map(s => <option key={s.id} value={s.id}>{s.marker} {s.name}</option>)}
                              </select>
                              <div className="flex gap-2 w-full sm:w-auto">
                                <button 
                                  onClick={() => handleScanWatchlist(selectedScanStrategy)} 
                                  disabled={!selectedScanStrategy || isScanning || watchlist.length === 0}
                                  className="flex-1 bg-cyan-700 text-white px-4 py-1.5 rounded font-bold text-sm hover:bg-cyan-600 disabled:opacity-50 transition-all whitespace-nowrap"
                                >
                                  {isScanning ? `⏳ (${scanProgress.current}/${scanProgress.total})` : '▶ 執行篩選'}
                                </button>
                                {Object.keys(scanResults).length > 0 && !isScanning && (
                                  <button onClick={() => setScanResults({})} className="text-slate-400 hover:text-red-400 text-sm font-bold px-3 py-1.5 bg-slate-900 rounded border border-slate-700 whitespace-nowrap">清除</button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 資料表格區域 */}
                          <div className="flex-1 flex flex-col overflow-hidden bg-[#020617]">
                            
                            {/* 標題列 (可點擊排序) */}
                            <div className="grid grid-cols-12 gap-2 p-3 bg-slate-800/80 border-b border-slate-700 text-xs text-slate-400 font-bold shrink-0">
                              <div className="col-span-5 cursor-pointer hover:text-cyan-300 flex items-center" onClick={() => handleSort('symbol')}>
                                股號/股名 {sortConfig.key === 'symbol' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                              </div>
                              <div className="col-span-3 cursor-pointer hover:text-pink-300 flex items-center justify-end" onClick={() => handleSort('change')}>
                                漲幅/狀態 {sortConfig.key === 'change' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                              </div>
                              <div className="col-span-2 cursor-pointer hover:text-amber-300 flex items-center justify-end" onClick={() => handleSort('volume')}>
                                成交量 {sortConfig.key === 'volume' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                              </div>
                              <div className="col-span-2 text-center">自選</div>
                            </div>

                            {/* 資料列 */}
                            <div className="flex-1 overflow-y-auto p-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-track]:bg-slate-900">
                              {isLoadingRanking ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                  <span className="text-5xl animate-bounce">🤖</span>
                                  <div className="text-purple-400 font-bold animate-pulse">精準辨識截圖中...</div>
                                </div>
                              ) : displayData.length > 0 ? (
                                <div className="flex flex-col gap-1.5">
                                  {displayData.map((stock, idx) => {
                                    const isStarred = watchlist.some(s => s.symbol === stock.symbol);
                                    return (
                                      <div 
                                        key={stock.symbol + idx}
                                        onClick={() => { fetchStockData(stock.symbol); setIsRankingOpen(false); }}
                                        className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 hover:border-slate-600 cursor-pointer transition-all active:scale-[0.98]"
                                      >
                                        <div className="col-span-5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 overflow-hidden">
                                          <span className="text-cyan-400 font-bold text-sm sm:text-base">{stock.symbol}</span>
                                          <span className="text-slate-300 font-bold text-xs sm:text-sm truncate">{stock.name}</span>
                                          {/* ✨ [新增] 顯示掃描結果的標籤 */}
                                          {rankingTab === 'watchlist' && scanResults[stock.symbol] === true && (
                                            <span className="bg-emerald-900/60 text-emerald-400 border border-emerald-500/50 px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap animate-pulse font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                                              🎯 符合
                                            </span>
                                          )}
                                          {rankingTab === 'watchlist' && scanResults[stock.symbol] === false && (
                                            <span className="text-slate-600 text-[10px] whitespace-nowrap font-bold">未符合</span>
                                          )}
                                        </div>
                                        <div className="col-span-3 text-right">
                                          <span className="text-pink-400 font-bold text-sm bg-pink-400/10 px-2 py-1 rounded inline-block whitespace-nowrap">
                                            {stock.change || '熱門'}
                                          </span>
                                        </div>
                                        <div className="col-span-2 text-right text-slate-400 text-xs sm:text-sm font-mono">
                                          {stock.volume || '-'}
                                        </div>
                                        <div className="col-span-2 flex justify-center">
                                          <button 
                                            onClick={(e) => toggleWatchlist(stock, e)}
                                            className="text-xl sm:text-2xl hover:scale-125 transition-transform"
                                            title={isStarred ? "移除自選" : "加入自選"}
                                          >
                                            {isStarred ? '⭐' : '☆'}
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
                                  <span className="text-4xl">📭</span>
                                  <div className="font-bold">
                                    {rankingTab === 'ranking' ? '請點選上方「📝 貼上排行」轉成名單' : '您的自選股名單空空如也'}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                }              
              />
            </div>
          ) : (
            <div className="flex-1 border border-cyan-900/50 rounded-xl bg-[#0f172a] shadow-inner flex flex-col items-center justify-center text-cyan-900 gap-4">
               <span className="text-6xl">📈</span>
               <span className="font-bold text-lg">等待輸入股號載入圖表...</span>
            </div>
          )}
        </div>

        {/* 右側：產業資訊與外部工具 (佔 2 格) */}
        <div className="xl:col-span-2 flex flex-col gap-4 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-cyan-900 [&::-webkit-scrollbar-track]:bg-transparent">
          <TechCard title="產業資訊" icon="🌍" glow="purple">
            <div className="flex flex-col gap-3">
              <button onClick={() => window.open('https://gemini.google.com/share/5dc98f62e00c?openExternalBrowser=1', '_blank')} className="w-full bg-slate-800 border border-slate-600 hover:border-indigo-500 text-indigo-300 py-2.5 rounded-lg font-bold shadow-sm transition-all text-sm text-left px-3 flex items-center gap-2">
                <span>🧮</span> 1. DCF 估值
              </button>
              <button onClick={() => window.open('https://gemini.google.com/share/fc1361ef0f25?openExternalBrowser=1', '_blank')} className="w-full bg-slate-800 border border-slate-600 hover:border-pink-500 text-pink-300 py-2.5 rounded-lg font-bold shadow-sm transition-all text-sm text-left px-3 flex items-center gap-2">
                <span>📊</span> 2. 財報分析
              </button>
              <button onClick={() => window.open('https://gemini.google.com/share/671a85db4a96?openExternalBrowser=1', '_blank')} className="w-full bg-slate-800 border border-slate-600 hover:border-blue-500 text-blue-300 py-2.5 rounded-lg font-bold shadow-sm transition-all text-sm text-left px-3 flex items-center gap-2">
                <span>🌍</span> 3. 產業規模
              </button>
              <button onClick={() => window.open('https://gemini.google.com/share/cbe5a830f8a7?openExternalBrowser=1', '_blank')} className="w-full bg-slate-800 border border-slate-600 hover:border-amber-500 text-amber-300 py-2.5 rounded-lg font-bold shadow-sm transition-all text-sm text-left px-3 flex items-center gap-2">
                <span>📈</span> 4. 營收觀察
              </button>

              <div className="w-full h-px bg-slate-700/50 my-2"></div>
              
              <button onClick={handleGoogleAIAnalysis} className="w-full bg-purple-900/60 border border-purple-500 text-purple-200 py-3 rounded-xl font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:bg-purple-800 transition-all flex items-center justify-center gap-2">
                <span className="text-lg">🤖</span> AI 產業深度診斷
              </button>
            </div>
          </TechCard>
        </div>

      </div>
      {/* ✨ 📝 手動貼上排行彈出視窗 */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 pointer-events-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg p-5 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-emerald-400 font-bold text-lg">📝 貼上文字排行</h3>
              <button onClick={() => setIsPasteModalOpen(false)} className="text-slate-400 hover:text-white font-bold">✕ 關閉</button>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              請將您在券商軟體、網頁或 Excel 複製的排行資料直接貼在下方。<br/>
              <span className="text-emerald-300 font-bold">💡 系統會自動掃描文字中的「4碼數字」轉換成股票選單！</span>
            </p>
            <textarea 
              value={pasteText} 
              onChange={(e) => setPasteText(e.target.value)} 
              className="w-full h-40 bg-slate-800 border border-slate-600 rounded-lg p-3 text-emerald-100 focus:outline-none focus:border-emerald-500 font-mono text-sm leading-relaxed"
              placeholder="請貼上內容，例如：&#10;2330 台積電 漲停&#10;2317 鴻海 大漲..."
            />
            <button onClick={handlePasteRanking} className="w-full bg-emerald-700 text-white font-bold py-3 rounded-lg hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all">
              🔍 開始解析並轉成名單
            </button>
          </div>
        </div>
      )}
      
      {/* ✨ 浮動的策略打造器 (計算機版) */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-[200] flex justify-center items-center bg-black/80 backdrop-blur-md p-2 sm:p-4 pointer-events-auto">
          <div className="bg-slate-900 rounded-2xl border border-cyan-700 shadow-[0_0_40px_rgba(8,145,178,0.5)] w-full max-w-2xl flex flex-col h-[90vh] sm:h-[80vh] overflow-hidden">
            
            {/* 標題與控制列 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border-b border-slate-700 bg-slate-800 shrink-0 gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xl">🧪</span>
                {/* 策略名稱輸入框 */}
                <input 
                  type="text" 
                  placeholder="幫策略取個名字..." 
                  value={strategyName} 
                  onChange={(e) => setStrategyName(e.target.value)} 
                  className="bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-cyan-300 font-bold text-sm outline-none focus:border-cyan-400 w-40 sm:w-48 shadow-inner placeholder-slate-600" 
                />
                {/* 標記圖案輸入框 (限制最多2個字，避免圖表太亂) */}
                <input 
                  type="text" 
                  placeholder="標記" 
                  value={strategyMarker} 
                  onChange={(e) => setStrategyMarker(e.target.value)} 
                  maxLength="2" 
                  className="bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-center text-pink-400 font-bold text-sm outline-none focus:border-pink-400 w-12 shadow-inner" 
                  title="顯示在 K 線上的圖案" 
                />
              </div>
              <div className="flex gap-2 shrink-0 self-end sm:self-auto">
                {/* ✨ 點擊儲存時，呼叫翻譯蒟蒻，如果成功就存入系統 */}
                <button 
                  onClick={() => {
                    if (builderFormula.length === 0) return showAlert('請先輸入公式！');
                    const newStrategy = parseFormulaToStrategy(builderFormula, strategyName, strategyMarker);
                    
                    if (newStrategy.error) {
                       // 翻譯失敗，跳出警告
                       showAlert(`公式錯誤：${newStrategy.error}`);
                    } else {
                       // 翻譯成功！存入記憶體中，並把舊的都關掉，只啟用最新寫好的這一個
                       setCustomStrategies(prev => {
                          const updated = prev.map(s => ({...s, isActive: false}));
                          return [newStrategy, ...updated];
                       });
                       setBuilderFormula([]); // 清空計算機
                       setIsBuilderOpen(false); // 關閉視窗
                       showAlert(`策略「${newStrategy.name}」已儲存並啟用！請在圖表上查看 🎯 標記。`);
                    }
                  }}
                  className="bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-1 rounded text-sm font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all"
                >
                  💾 儲存策略
                </button>
                <button onClick={() => setIsBuilderOpen(false)} className="text-slate-400 hover:text-white font-bold bg-slate-900 px-3 py-1 rounded border border-slate-700">✕</button>
              </div>
            </div>

            {/* 公式顯示螢幕 */}
            <div className="p-3 bg-[#020617] shrink-0 border-b border-slate-700">
               <div className="w-full h-32 sm:h-40 bg-slate-800 border-2 border-slate-600 rounded-lg p-3 overflow-y-auto text-lg leading-relaxed flex flex-wrap content-start gap-1">
                  {builderFormula.length === 0 && <span className="text-slate-500 italic">請使用下方鍵盤輸入公式...</span>}
                  {builderFormula.map((token, idx) => {
                     // 讓邏輯字眼變紅色，數字變黃色，其他變藍色
                     let colorClass = "text-cyan-300";
                     if (['而且', '或者', '>', '<', '≥', '≤', '=', '+', '-', '×', '÷'].includes(token)) colorClass = "text-red-400 font-bold";
                     else if (!isNaN(token)) colorClass = "text-amber-400 font-mono";
                     return <span key={idx} className={colorClass}>{token}</span>;
                  })}
               </div>
               <div className="flex justify-end gap-2 mt-2">
                  {/* ✨ 改用新的智能退格 */}
                  <button onClick={handleBackspace} className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold shadow-sm">⌫ 退格</button>
                  <button onClick={() => setBuilderFormula([])} className="px-4 py-1.5 bg-red-900/50 border border-red-700 hover:bg-red-800 text-red-200 rounded font-bold shadow-sm">🗑️ 清除</button>
               </div>
            </div>

            {/* 鍵盤頁籤 */}
            <div className="flex bg-slate-800 shrink-0">
               {['運算', '價量', '指標', '盤後'].map(tab => (
                 <button 
                   key={tab} 
                   onClick={() => setBuilderTab(tab)}
                   className={`flex-1 py-3 font-bold text-sm sm:text-base border-b-2 transition-all ${builderTab === tab ? 'border-cyan-400 text-cyan-300 bg-slate-700/50' : 'border-transparent text-slate-400 hover:bg-slate-700/30'}`}
                 >
                   {tab}
                 </button>
               ))}
            </div>

            {/* 鍵盤按鈕區 */}
            <div className="flex-1 overflow-y-auto p-2 bg-slate-900">
               {builderTab === '運算' && (
                 <div className="flex flex-col gap-5 h-full content-start overflow-y-auto pr-1 pb-4">
                    
                    {/* 1. 邏輯與括號區 */}
                    <div>
                      <div className="text-xs font-bold text-slate-500 mb-2 tracking-widest">邏輯與群組</div>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {['而且', '或者', '(', ')', '如果', '成立取', '否則取'].map(btn => (
                          <button key={btn} onClick={() => handleFormulaInput(btn)} className="py-2.5 rounded font-bold text-sm bg-slate-800 border-slate-700 text-pink-400 hover:bg-slate-700 border active:scale-95 transition-transform shadow-sm">{btn}</button>
                        ))}
                      </div>
                    </div>

                    {/* 2. 比較符號區 */}
                    <div>
                      <div className="text-xs font-bold text-slate-500 mb-2 tracking-widest">比較符號</div>
                      <div className="grid grid-cols-6 gap-2">
                        {['>', '≥', '<', '≤', '=', '≠'].map(btn => (
                          <button key={btn} onClick={() => handleFormulaInput(btn)} className="py-2.5 rounded font-bold text-lg bg-slate-800 border-slate-700 text-cyan-300 hover:bg-slate-700 border active:scale-95 transition-transform shadow-sm">{btn}</button>
                        ))}
                      </div>
                    </div>

                    {/* 3. 數字與四則運算區 (九宮格排列) */}
                    <div>
                      <div className="text-xs font-bold text-slate-500 mb-2 tracking-widest">數字與基本運算</div>
                      <div className="grid grid-cols-4 gap-2 max-w-[280px]">
                         {/* 第 1 排 */}
                         {['7', '8', '9', '+'].map(btn => (
                           <button key={btn} onClick={() => handleFormulaInput(btn)} className={`py-3 rounded font-bold text-xl border active:scale-95 transition-transform shadow-sm ${isNaN(btn) ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'}`}>{btn}</button>
                         ))}
                         {/* 第 2 排 */}
                         {['4', '5', '6', '-'].map(btn => (
                           <button key={btn} onClick={() => handleFormulaInput(btn)} className={`py-3 rounded font-bold text-xl border active:scale-95 transition-transform shadow-sm ${isNaN(btn) ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'}`}>{btn}</button>
                         ))}
                         {/* 第 3 排 */}
                         {['1', '2', '3', '×'].map(btn => (
                           <button key={btn} onClick={() => handleFormulaInput(btn)} className={`py-3 rounded font-bold text-xl border active:scale-95 transition-transform shadow-sm ${isNaN(btn) ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'}`}>{btn}</button>
                         ))}
                         {/* 第 4 排 */}
                         {['.', '0', '00', '÷'].map(btn => (
                           <button key={btn} onClick={() => handleFormulaInput(btn)} className={`py-3 rounded font-bold text-xl border active:scale-95 transition-transform shadow-sm ${btn === '÷' ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'}`}>{btn}</button>
                         ))}
                      </div>
                    </div>

                 </div>
               )}
               
               {builderTab === '價量' && (
                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 h-full content-start">
                    {['開盤價', '最高價', '最低價', '收盤價', '成交量', '均價', '均量', '漲跌幅', '1日前的', '2日前的', '3日前的', '5日前的(週)', '10日前的(雙週)'].map(btn => {
                      // 讓時間偏移的按鈕顯示粉紅色，一般價量顯示靛藍色
                      const isTimeOffset = btn.includes('日前的');
                      return (
                        <button 
                          key={btn} 
                          onClick={() => handleFormulaInput(btn)} 
                          className={`py-3 sm:py-4 rounded font-bold text-sm sm:text-base border active:scale-95 transition-transform ${isTimeOffset ? 'bg-pink-900/30 border-pink-700/50 text-pink-300 hover:bg-pink-800/50' : 'bg-indigo-900/40 border-indigo-700/50 text-indigo-300 hover:bg-indigo-800/60'}`}
                        >
                          {btn}
                        </button>
                      );
                    })}
                 </div>
               )}

               {builderTab === '指標' && (
                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 h-full content-start">
                    {['5日均線', '10日均線', '20日均線', '5日均量', 'K值', 'D值', 'RSI值', 'MACD值', 'DIF值', 'OSC值', 'OBV值', '威廉指標', '布林上軌', '布林下軌'].map(btn => (
                      <button key={btn} onClick={() => handleFormulaInput(btn)} className="py-4 bg-emerald-900/40 border border-emerald-700/50 text-emerald-300 rounded font-bold hover:bg-emerald-800/60 active:scale-95 transition-transform">{btn}</button>
                    ))}
                 </div>
               )}

               {builderTab === '盤後' && (
                 <div className="grid grid-cols-2 gap-2 h-full content-start">
                    {['外資買賣超', '投信買賣超', '自營商買賣超', '主力進出', '融資增減', '融券增減', '股本(億)'].map(btn => (
                      <button key={btn} onClick={() => handleFormulaInput(btn)} className="py-4 bg-purple-900/40 border border-purple-700/50 text-purple-300 rounded font-bold hover:bg-purple-800/60 active:scale-95 transition-transform">{btn}</button>
                    ))}
                 </div>
               )}
            </div>

          </div>
        </div>
      )}
    </div>   
  );         
};
const MetricSelector = ({ value, onChange }) => (
  <div className="flex flex-wrap gap-1 shrink-0 items-center bg-slate-800/50 p-1.5 rounded-lg border border-slate-700">
    <select value={value.target} onChange={e => onChange(e.target.value, 'target')} className="p-1.5 border border-slate-600 rounded-md bg-slate-900 text-slate-300 text-sm outline-none focus:border-cyan-500"><option value="close">收盤價</option><option value="open">開盤價</option><option value="high">最高價</option><option value="low">最低價</option><option value="volume">成交量(張)</option><option value="changeRatio">漲跌幅(%)</option><option value="bodyRatio">K線實體幅(%)</option><option value="amplitude">振幅(%)</option></select>
    <select value={value.scope} onChange={e => onChange(e.target.value, 'scope')} className="p-1.5 border border-slate-600 rounded-md bg-slate-900 text-slate-300 text-sm outline-none focus:border-cyan-500"><option value="today">單日</option><option value="ago">單一 N 日前</option><option value="max">近 N 日最大</option><option value="min">近 N 日最小</option><option value="sum">近 N 日總和</option><option value="avg">近 N 日平均</option></select>
    {value.scope !== 'today' && (<div className="flex items-center gap-1 bg-slate-900 border border-slate-600 rounded-md px-1 h-[34px]"><span className="text-xs text-slate-500 font-bold ml-1">N=</span><input type="number" min="1" max="100" value={value.n || 1} onChange={e => onChange(e.target.value, 'n')} className="p-1 w-10 text-center text-sm outline-none bg-transparent text-cyan-300 font-bold" /></div>)}
    
    {/* ✨ 新增：往前推幾天的設定 (Offset) */}
    <div className="flex items-center gap-1 bg-slate-900 border border-slate-600 rounded-md px-2 h-[34px] ml-1">
      <span className="text-xs text-slate-400 font-bold">往前推</span>
      <input type="number" min="0" max="100" value={value.offset || 0} onChange={e => onChange(e.target.value, 'offset')} className="p-1 w-10 text-center text-sm outline-none bg-transparent text-pink-400 font-bold" />
      <span className="text-xs text-slate-400 font-bold">天</span>
    </div>
  </div>
);
// === 📈 K線圖與終極畫線工具 (已移除平移) ===
const TrendChart = ({ data, timeframe, stockName, toggles, onToggleCrosshair, customStrategies, maParams, vmaParams, defensivePrice, realSymbol, displayCount, indicatorType, indicatorParams, setDisplayCount, totalDataLength, savedLayouts, setSavedLayouts, onLoadLayout, rankingList, onOpenRanking, rankingModalContent }) => {
  const chartContainerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const svgRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [crosshair, setCrosshair] = useState(null); 
  const [chartModal, setChartModal] = useState(null);

  // ✨ 新增：圖表動態寬度狀態與全圖判定
  const [chartWidth, setChartWidth] = useState(1200);
  const [chartHeight, setChartHeight] = useState(600);
  const isFullChart = displayCount === 9999; // ✨ 修正：改用 9999 專屬代號，避免小週期的卡死問題

  // === 磁吸開關 ===
  const [isMagnetOn, setIsMagnetOn] = useState(false);

  // === 畫布縮放狀態 ===
  const [pinchDist, setPinchDist] = useState(null);

  // === 畫線工具狀態 ===
  const [activeTool, setActiveTool] = useState('cursor'); 
  const [drawColor, setDrawColor] = useState('#22d3ee'); 
  const [drawWidth, setDrawWidth] = useState(2);
  const [drawOpacity, setDrawOpacity] = useState(0.5); // ✨ 預設透明度改為 0.5 (50%)
  const [textSize, setTextSize] = useState(16);
  
  const [drawings, setDrawings] = useState([]);
  const [history, setHistory] = useState([[]]);
  const [historyStep, setHistoryStep] = useState(0);

  const [draftPoints, setDraftPoints] = useState([]); 
  const [hoverPoint, setHoverPoint] = useState(null);
  const [editingPoint, setEditingPoint] = useState(null); 

  // ✨ 雲端畫板彈窗狀態
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);

  // === 漂浮工具列 ===
  const [toolbarPos, setToolbarPos] = useState({ x: 10, y: 110 });
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  const [draggingToolbar, setDraggingToolbar] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0, mouseX: 0, mouseY: 0 });
  
  // ✨ 拖曳狀態防鬼鍵
  const [isDrawingDrag, setIsDrawingDrag] = useState(false);
  const lastTouchTime = useRef(0);

  // ✨ 不同週期的畫線各自獨立儲存
  useEffect(() => {
    const savedDrawings = localStorage.getItem(`CHART_DRAWINGS_${realSymbol}_${timeframe}`);
    let initDrawings = [];
    if (savedDrawings) { try { initDrawings = JSON.parse(savedDrawings); } catch(e) {} }
    setDrawings(initDrawings);
    setHistory([initDrawings]);
    setHistoryStep(0);
    setDraftPoints([]);
    setActiveTool('cursor');
    setEditingPoint(null);
    setIsDrawingDrag(false);
  }, [realSymbol, timeframe]);

  // ✨ 切換週期時自動清除游標，防止越界崩潰
  useEffect(() => {
    setCrosshair(null);
    setHoverPoint(null);
  }, [data.length, timeframe]);

  // ✨ 動態監聽容器尺寸，實現完美直橫式視角與滑桿縮放 (防呆安全版)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateSize = () => {
      const cw = container.clientWidth || 1200;
      const ch = container.clientHeight || 600; 
      
      setChartHeight(ch); 

      const currentDataLen = data ? data.length : 0;
      const currentExtra = Math.floor(currentDataLen * 0.15) || 15;
      const totalSlots = currentDataLen + currentExtra;
      
      // 🛡️ 安全保護：自動判斷你是否有兩指縮放功能，沒有也不會當機！
      const currentScale = typeof zoomScale !== 'undefined' ? zoomScale : 1;
      const calculatedWidth = (cw / displayCount) * totalSlots * currentScale; 
      
      setChartWidth(Math.max(cw, calculatedWidth));
    };

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(container);
    updateSize();

    // 🛡️ 將 zoomScale 移出依賴陣列，徹底防止黑畫面
    return () => observer.disconnect();
  }, [displayCount, data ? data.length : 0]);

  // ✨ 標題永遠置中的追蹤雷達 (60fps光速跟隨)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateTitlePosition = () => {
      const title = document.getElementById('chart-title');
      if (title) {
        // 動態將 X 座標設為「目前滾動距離 + 螢幕一半」，讓標題永遠黏在視角正中間！
        title.setAttribute('x', container.scrollLeft + container.clientWidth / 2);
      }
    };

    // 監聽手指滑動與拖曳
    container.addEventListener('scroll', updateTitlePosition);
    
    // 剛載入、翻轉螢幕、或切換 K 棒數量時，主動對齊一次
    updateTitlePosition();
    // 延遲 150 毫秒再確認一次，確保自動滾動到最新日期後標題有跟上
    setTimeout(updateTitlePosition, 150); 

    return () => container.removeEventListener('scroll', updateTitlePosition);
  }, [displayCount, isFullscreen, data.length]);

  // ✨ 自動滾動到最右側，但「隱藏未來留白」(滑動才會出現)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && !isFullChart) {
      setTimeout(() => {
        const scrollW = container.scrollWidth;
        const clientW = container.clientWidth;

        // 1. 抓出你目前的 K 棒總數與留白數量
        const currentDataLen = data ? data.length : 0;
        // 💡 這裡的 0.25 (25%) 或 0.15 (15%) 要跟你畫布計算寬度的留白比例一致
        const extraSlots = Math.floor(displayCount * 0.25) || 15; 
        const totalSlots = currentDataLen + extraSlots;
        
        if (totalSlots === 0) return;
        
        // 2. 算出一根 K 棒有多寬，進而推算出「留白區塊」總共佔了幾 Pixel
        const singleSlotWidth = scrollW / totalSlots;
        const extraWidth = extraSlots * singleSlotWidth;

        // 3. 算出極限位置後，往回扣除留白寬度，讓最新 K 棒剛好貼齊右側邊緣！
        const maxScroll = scrollW - clientW; 
        container.scrollLeft = Math.max(0, maxScroll - extraWidth);

      }, 50); 
    }
  }, [realSymbol, timeframe, isFullscreen, data?.length, displayCount, isFullChart]);

  const commitDrawings = (newDrawings) => {
    setDrawings(newDrawings);
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newDrawings);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
    localStorage.setItem(`CHART_DRAWINGS_${realSymbol}_${timeframe}`, JSON.stringify(newDrawings));
  };

  const handleUndo = (e) => { 
    e.stopPropagation();
    if (historyStep > 0) { 
        const prev = historyStep - 1;
        setHistoryStep(prev); 
        setDrawings(history[prev]); 
        localStorage.setItem(`CHART_DRAWINGS_${realSymbol}_${timeframe}`, JSON.stringify(history[prev])); 
        setDraftPoints([]); 
    } 
  };
  
  const handleRedo = (e) => { 
    e.stopPropagation();
    if (historyStep < history.length - 1) { 
        const next = historyStep + 1;
        setHistoryStep(next); 
        setDrawings(history[next]); 
        localStorage.setItem(`CHART_DRAWINGS_${realSymbol}_${timeframe}`, JSON.stringify(history[next])); 
        setDraftPoints([]); 
    } 
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    setChartModal({
      type: 'confirm',
      message: '確定清除所有畫線與標註？',
      onConfirm: () => {
        commitDrawings([]); 
        setDraftPoints([]); 
        setChartModal(null);
      },
      onCancel: () => setChartModal(null)
    });
  };

  // ✨ 單獨刪除指定畫線物件
  const handleDeleteDrawing = (id) => {
    const newDrawings = drawings.filter(d => d.id !== id);
    commitDrawings(newDrawings);
  };

  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        if (chartContainerRef.current.requestFullscreen) await chartContainerRef.current.requestFullscreen();
        else if (chartContainerRef.current.webkitRequestFullscreen) await chartContainerRef.current.webkitRequestFullscreen();
        if (window.screen && window.screen.orientation && window.screen.orientation.lock) { try { await window.screen.orientation.lock('landscape'); } catch (e) {} }
        
        // ✨ 進入橫向時，自動載入 240 根 K 線
        setDisplayCount(120);

      } catch (err) { setIsFullscreen(!isFullscreen); }
    } else {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
      if (window.screen && window.screen.orientation && window.screen.orientation.unlock) { try { window.screen.orientation.unlock(); } catch (e) {} }
      
      // ✨ 退出橫向時，恢復你原本的 60 根
      setDisplayCount(120);
    }
  };

  const startDragToolbar = (e) => {
    setDraggingToolbar(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartPos.current = { x: toolbarPos.x, y: toolbarPos.y, mouseX: clientX, mouseY: clientY };
  };

  useEffect(() => {
    const doDragToolbar = (e) => {
      if (!draggingToolbar) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = clientX - dragStartPos.current.mouseX;
      const dy = clientY - dragStartPos.current.mouseY;
      setToolbarPos({ x: Math.max(0, dragStartPos.current.x + dx), y: Math.max(0, dragStartPos.current.y + dy) });
    };
    const stopDragToolbar = () => setDraggingToolbar(false);

    if (draggingToolbar) {
      window.addEventListener('mousemove', doDragToolbar); window.addEventListener('mouseup', stopDragToolbar);
      window.addEventListener('touchmove', doDragToolbar, {passive: false}); window.addEventListener('touchend', stopDragToolbar);
      return () => {
        window.removeEventListener('mousemove', doDragToolbar); window.removeEventListener('mouseup', stopDragToolbar);
        window.removeEventListener('touchmove', doDragToolbar); window.removeEventListener('touchend', stopDragToolbar);
      };
    }
  }, [draggingToolbar, toolbarPos]);

  if (!data || data.length === 0) return null;

  const width = chartWidth; // ✨ 使用動態寬度取代原本寫死的 1200
  const padding = 30;
  const indPadding = 15;
  
  // ✨ 動態分配高度 (完美分流版)：只有橫向放大時才撐滿螢幕，直式恢復原本的舒服高度！
  const volHeight = isFullscreen ? 70 : 120;
  const indicatorHeight = indicatorType !== 'None' ? (isFullscreen ? 70 : 120) : 0;
  const chartPaddingTop = isFullscreen ? 35 : 80;
  const bottomLegendHeight = 40; 
  
  let mainHeight = 400; // 直式預設主圖高度 (固定)
  let totalSVGHeight = mainHeight + volHeight + indicatorHeight + 80; // 直式預設總高度 (固定)
  
  // 如果是橫向翻轉(放大)，才用實際容器高度來反推主圖高度，解決上下留白
  if (isFullscreen) {
    totalSVGHeight = Math.max(chartHeight, 350); 
    mainHeight = totalSVGHeight - volHeight - indicatorHeight - bottomLegendHeight;
  }

  // ✨ 動態計算額外的空白 K 棒數 (預留 15% 空間給未來畫線用)
  const extraCandles = Math.floor(data.length * 0.15) || 15; 
  const totalSlots = data.length + extraCandles;

  let actualMax = -Infinity; let actualMin = Infinity;
  const activeCustomStrats = customStrategies ? customStrategies.filter(s => s.isActive) : [];

  data.forEach((d) => { if (d.high > actualMax) { actualMax = d.high; } if (d.low < actualMin) { actualMin = d.low; } });
  const minPrice = Math.min(actualMin, (toggles.showVolSignal && defensivePrice) ? defensivePrice : Infinity) * 0.95; 
  const maxPrice = actualMax * 1.05; 
  const maxVol = Math.max(...data.map(d => d.volume)) * 1.1;

  const getY = (p) => mainHeight - padding - ((p - minPrice) / (maxPrice - minPrice)) * (mainHeight - padding - chartPaddingTop);
  const getVolY = (v) => volHeight - (v / maxVol) * (volHeight - 10);
  
  // ✨ 將間距計算改為包含未來空白區的 totalSlots
  const spacing = (width - padding * 2) / totalSlots; 
  const candleWidth = Math.max(0.5, spacing * 0.7); // ✨ 將最小寬度改為 0.5px，讓全圖壓縮時 K 棒不會糊成一團

  const getLinePath = (data, key) => data.map((d, i) => { return d[key] === null ? '' : `${i === 0 || data[i-1][key] === null ? 'M' : 'L'} ${padding + i * spacing + spacing / 2} ${key.startsWith('ma') ? getY(d[key]) : getVolY(d[key])}`; }).join(' ');

  // === 🎯 相對座標系統 (還原不平移版) ===
  const getSnappedDataPoint = (clientX, clientY) => {
    const svg = svgRef.current; if (!svg) return null;
    const pt = svg.createSVGPoint(); pt.x = clientX; pt.y = clientY;
    const pos = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    let exactIdxFloat = (pos.x - padding - spacing/2) / spacing;
    if (exactIdxFloat < 0) exactIdxFloat = 0; 
    
    // ✨ 允許游標範圍延伸至右側未來空白區
    if (exactIdxFloat > totalSlots - 1) exactIdxFloat = totalSlots - 1; 
    
    const snappedIdx = Math.round(exactIdxFloat);
    const d = data[snappedIdx]; // 注意：在未來空白區時 d 會是 undefined
    
    const rawPrice = minPrice + (maxPrice - minPrice) * ((mainHeight - padding - pos.y) / (mainHeight - padding - chartPaddingTop));
    let finalPrice = rawPrice;
    
    let finalIdxFromEnd = data.length - 1 - exactIdxFloat; 

    if (isMagnetOn && d) {
      const prices = [d.open, d.high, d.low, d.close];
      let minDiff = Math.abs(prices[0] - rawPrice);
      finalPrice = prices[0];
      for(let i=1; i<4; i++){ 
        let diff = Math.abs(prices[i] - rawPrice); 
        if(diff < minDiff){ minDiff = diff; finalPrice = prices[i]; } 
      }
      finalIdxFromEnd = data.length - 1 - snappedIdx; 
    }
    
    return { idxFromEnd: finalIdxFromEnd, price: finalPrice, rawX: pos.x, rawY: pos.y, exactIdx: snappedIdx };
  };

  const resolvePoint = (pt) => { 
    const x = padding + (data.length - 1 - pt.idxFromEnd) * spacing + spacing / 2; 
    return { x, y: getY(pt.price), price: pt.price }; 
  };

  // ✨ 新增：整體拖曳與複製邏輯 (供微調模式使用)
  const handleDragWholeStart = (e, d) => {
    e.stopPropagation();
    // ✨ 加入防鬼鍵 (防雙重觸發) 邏輯
    if (e.type === 'mousedown' && (Date.now() - lastTouchTime.current < 500)) return;
    if (e.type.startsWith('touch')) lastTouchTime.current = Date.now();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const snap = getSnappedDataPoint(clientX, clientY);
    if (snap) {
        setEditingPoint({ 
            id: d.id, 
            pointIdx: 'whole', 
            startPt: snap, 
            originalPoints: JSON.parse(JSON.stringify(d.points)) 
        });
    }
  };

  // ✨ 新增獨立的按鈕處理函式來防止複製鍵連點出兩個
  const onCloneClick = (e, d) => {
    e.stopPropagation();
    if (e.type === 'mousedown' && (Date.now() - lastTouchTime.current < 500)) return;
    if (e.type.startsWith('touch')) lastTouchTime.current = Date.now();
    handleCloneShape(d);
  };

  const handleCloneShape = (shape) => {
    const newShape = JSON.parse(JSON.stringify(shape));
    newShape.id = Date.now();
    
    // 如果圖形有寬度，往右投影等距的寬度；如果是垂直線等無寬度圖形，預設位移 5 根 K 棒
    if (newShape.points.length >= 2) {
        const idxDiff = Math.abs(newShape.points[1].idxFromEnd - newShape.points[0].idxFromEnd);
        const offset = Math.max(idxDiff, 5);
        newShape.points.forEach(p => { p.idxFromEnd -= offset; });
    } else {
        newShape.points.forEach(p => { p.idxFromEnd -= 5; });
    }
    commitDrawings([...drawings, newShape]);
    setEditingPoint(null);
  };

  // ✨ 手勢：按下開始 (拖曳)
  const handlePointerDown = (e) => {
    if (e.type === 'mousedown' && (Date.now() - lastTouchTime.current < 500)) return;
    if (e.type.startsWith('touch')) lastTouchTime.current = Date.now();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const snap = getSnappedDataPoint(clientX, clientY);
    if (!snap) return;

    // ✨ 在微調與橡皮擦模式下，不觸發新的作圖起點
    if (activeTool === 'edit' || activeTool === 'eraser') return; 

    const newPt = { idxFromEnd: snap.idxFromEnd, price: snap.price };
    setHoverPoint(newPt); 

    if (activeTool === 'text') {
      setChartModal({
        type: 'prompt', message: '請輸入要標註的文字：',
        onConfirm: (txt) => {
          if (txt && txt.trim()) commitDrawings([...drawings, { id: Date.now(), type: 'text', points: [newPt], text: txt, color: drawColor, size: textSize, opacity: drawOpacity }]); // ✨ 加入 opacity
          setActiveTool('cursor'); setChartModal(null);
        },
        onCancel: () => { setActiveTool('cursor'); setChartModal(null); }
      });
    } else if (['segment', 'arrow', 'trend', 'rect', 'fibo', 'crossline', 'measure', 'pen'].includes(activeTool)) {
      setDraftPoints([newPt]);
      setIsDrawingDrag(true);
    } else if (activeTool === 'n-shape' || activeTool === 'wave') {
      if (draftPoints.length === 0) {
        setDraftPoints([newPt]); setIsDrawingDrag(true);
      } else if (draftPoints.length >= 1) {
        setIsDrawingDrag(true);
      }
    }
  };

  // ✨ 手勢：移動 (游標或拖曳畫線)
  const handlePointerMove = (e) => {
    if (e.type === 'mousemove' && (Date.now() - lastTouchTime.current < 500)) return;
    if (e.type.startsWith('touch')) lastTouchTime.current = Date.now();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const snap = getSnappedDataPoint(clientX, clientY);
    if (!snap) return;

    if (activeTool === 'cursor') {
      let priceHover = null;
      if (snap.rawY >= 0 && snap.rawY <= mainHeight) priceHover = minPrice + (maxPrice - minPrice) * ((mainHeight - padding - snap.rawY) / (mainHeight - padding - chartPaddingTop));
      setCrosshair({ x: snap.rawX, y: snap.rawY, idx: snap.exactIdx, priceHover });
    } else if (activeTool === 'edit' && editingPoint) {
      const newDrawings = drawings.map(d => {
        if (d.id === editingPoint.id) {
          if (editingPoint.pointIdx === 'whole') {
             // ✨ 計算整體拖曳偏移量
             const dIdx = snap.idxFromEnd - editingPoint.startPt.idxFromEnd;
             const dPrice = snap.price - editingPoint.startPt.price;
             const newPts = editingPoint.originalPoints.map(p => ({
                 idxFromEnd: p.idxFromEnd + dIdx,
                 price: p.price + dPrice
             }));
             return { ...d, points: newPts };
          } else {
             // 原始單點微調
             const newPts = [...d.points]; newPts[editingPoint.pointIdx] = { idxFromEnd: snap.idxFromEnd, price: snap.price };
             return { ...d, points: newPts };
          }
        }
        return d;
      });
      setDrawings(newDrawings);
    } else {
      setCrosshair(null);
      setHoverPoint({ idxFromEnd: snap.idxFromEnd, price: snap.price });


      // ✨ 處理畫筆連續作圖
      if (activeTool === 'pen' && isDrawingDrag) {
         setDraftPoints(prev => {
            const lastPt = prev[prev.length - 1];
            // 💡 效能優化防呆：防止加入距離太近的點（如果沒移動超過 0.001 就忽略），避免消耗過多效能導致卡頓
            if (lastPt && lastPt.idxFromEnd === snap.idxFromEnd && Math.abs(lastPt.price - snap.price) < 0.001) return prev;
            return [...prev, { idxFromEnd: snap.idxFromEnd, price: snap.price }];
         });
      }
    }
  };

  // ✨ 手勢：放開 (確定畫線)
  const handlePointerUp = () => {
    setPinchDist(null);
    
    if (activeTool === 'edit' && editingPoint) { 
        commitDrawings(drawings); 
        setEditingPoint(null); 
    }

    if (isDrawingDrag && hoverPoint && draftPoints.length > 0) {
      const isSamePoint = (p1, p2) => p1.idxFromEnd === p2.idxFromEnd && Math.abs(p1.price - p2.price) < 0.0001;

      if (activeTool === 'pen') {
        if (draftPoints.length > 1) {
          commitDrawings([...drawings, { id: Date.now(), type: 'pen', points: draftPoints, color: drawColor, width: drawWidth, opacity: drawOpacity }]);
        }
        setDraftPoints([]); setIsDrawingDrag(false);
      } else if (['segment', 'arrow', 'trend', 'rect', 'fibo', 'measure'].includes(activeTool)) {
        if (!isSamePoint(draftPoints[0], hoverPoint)) {
          commitDrawings([...drawings, { id: Date.now(), type: activeTool, points: [draftPoints[0], hoverPoint], color: drawColor, width: drawWidth, opacity: drawOpacity }]); // ✨ 加入 opacity
        }
        setDraftPoints([]); setIsDrawingDrag(false);
      } else if (activeTool === 'crossline') {
        if (draftPoints.length === 1 && hoverPoint) {
          commitDrawings([...drawings, { id: Date.now(), type: 'crossline', points: [hoverPoint], color: drawColor, width: drawWidth, opacity: drawOpacity }]); // ✨ 加入 opacity
        }
        setDraftPoints([]); setIsDrawingDrag(false);
      } else if (activeTool === 'n-shape') {
        if (draftPoints.length === 1) {
          if (!isSamePoint(draftPoints[0], hoverPoint)) setDraftPoints([draftPoints[0], hoverPoint]);
          else setDraftPoints([]);
          setIsDrawingDrag(false);
        } else if (draftPoints.length === 2) {
          if (!isSamePoint(draftPoints[1], hoverPoint)) {
            commitDrawings([...drawings, { id: Date.now(), type: 'n-shape', points: [draftPoints[0], draftPoints[1], hoverPoint], color: drawColor, width: drawWidth, opacity: drawOpacity }]); // ✨ 加入 opacity
            setDraftPoints([]);
          }
          setIsDrawingDrag(false);
        }
      } else if (activeTool === 'wave') {
        if (draftPoints.length >= 1 && draftPoints.length < 3) {
          // 還沒畫完 4 個點 (3波段)，繼續把目前的 hoverPoint 加進 draft
          if (!isSamePoint(draftPoints[draftPoints.length-1], hoverPoint)) {
            setDraftPoints([...draftPoints, hoverPoint]);
          }
          setIsDrawingDrag(false);
        } else if (draftPoints.length === 3) {
          // 最後一個點，完成波段工具
          if (!isSamePoint(draftPoints[2], hoverPoint)) {
            commitDrawings([...drawings, { id: Date.now(), type: 'wave', points: [...draftPoints, hoverPoint], color: drawColor, width: drawWidth, opacity: drawOpacity }]);
            setDraftPoints([]);
          }
          setIsDrawingDrag(false);
        }
      }
    }
  };

  // 🍎 完美相容 Apple 與 Android 的存圖機制 (所見即所得、絕對不跳出全螢幕版)
  const handleDownloadImage = () => {
    setCrosshair(null); setHoverPoint(null);

    // ✨ 拔除 window.confirm，直接預設儲存「目前螢幕看見的範圍」，保護全螢幕不中斷！
    const onlyVisible = true; 

    setTimeout(() => {
      const svg = document.getElementById('trend-chart-svg'); 
      const container = scrollContainerRef.current; 
      if (!svg || !container) return;

      const fullWidth = svg.getBoundingClientRect().width;
      const fullHeight = svg.getBoundingClientRect().height;
      const visibleWidth = container.clientWidth;
      const scrollX = container.scrollLeft;

      // ✨ 動態把標題移到「目前可見範圍」的正中央，確保存圖一定有股號
      const titleText = svg.querySelector('#chart-title');
      if (titleText) {
          titleText.setAttribute('x', scrollX + visibleWidth / 2);
      }

      const svgData = new XMLSerializer().serializeToString(svg);
      
      // ✨ 存完圖馬上把標題恢復原位
      if (titleText) {
          titleText.setAttribute('x', fullWidth / 2);
      }

      const canvas = document.createElement("canvas"); 
      const ctx = canvas.getContext("2d"); 
      const img = new Image();
      
      // ✨ 目標寬度就是你當下螢幕的寬度
      const targetWidth = visibleWidth;
      const scale = 2; // 維持 2 倍高畫質

      canvas.width = targetWidth * scale; 
      canvas.height = fullHeight * scale;
      
      img.onload = () => {
        ctx.fillStyle = "#0f172a"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height); 
        
        // ✨ 把畫布往左平移，精準切下你目前螢幕停留的畫面
        ctx.translate(-scrollX * scale, 0);
        ctx.drawImage(img, 0, 0, fullWidth * scale, fullHeight * scale);
        
        // 👇 雙平台下載邏輯完全保留 👇
        const isAppleDevice = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) || /Macintosh/i.test(navigator.userAgent);
        const fileName = `${stockName}_策略圖_目前視角_${new Date().toISOString().split('T')[0]}.png`;
        
        if (isAppleDevice) {
           canvas.toBlob((blob) => {
             if (!blob) return;
             const url = URL.createObjectURL(blob);
             const a = document.createElement("a");
             a.href = url;
             a.download = fileName;
             a.target = "_blank"; 
             document.body.appendChild(a); 
             a.click();
             document.body.removeChild(a);
             setTimeout(() => URL.revokeObjectURL(url), 1000);
           }, "image/png");
        } else {
           const a = document.createElement("a");
           a.download = fileName;
           a.href = canvas.toDataURL("image/png");
           a.click();
        }
      };
      
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
    }, 100); 
  };

  const renderDrawingObject = (drawObj, isDraft = false) => {
    const isSinglePointDrag = isDraft && drawObj.type === 'crossline';
    const pts = isSinglePointDrag ? [resolvePoint(hoverPoint)] : drawObj.points.map(resolvePoint);
    const rawPts = isSinglePointDrag ? [hoverPoint] : drawObj.points;
    const idKey = drawObj.id || 'draft';
    const baseOpacity = drawObj.opacity ?? 1; // ✨ 讀取圖形專屬透明度 (舊圖形預設為 1)
    
    const renderDots = () => {
      if (drawObj.type === 'pen') return null;
      return (
        <>
          {pts.map((pt, idx) => (
            <g key={`dot-${idx}`}>
              <circle cx={pt.x} cy={pt.y} r={4} fill={drawObj.color} opacity={isDraft ? baseOpacity * 0.8 : baseOpacity} pointerEvents="none" />
              
              {/* ✨ 微調模式：單點拖曳控制 (透明感應區) */}
              {activeTool === 'edit' && !isDraft && (
                <circle 
                  cx={pt.x} cy={pt.y} r={20} 
                  fill="transparent" 
                  className="cursor-move" 
                  pointerEvents="all"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (e.type === 'mousedown' && (Date.now() - lastTouchTime.current < 500)) return;
                    if (e.type.startsWith('touch')) lastTouchTime.current = Date.now();
                    setEditingPoint({ id: drawObj.id, pointIdx: idx });
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    if (e.type === 'mousedown' && (Date.now() - lastTouchTime.current < 500)) return;
                    if (e.type.startsWith('touch')) lastTouchTime.current = Date.now();
                    setEditingPoint({ id: drawObj.id, pointIdx: idx });
                  }}
                />
              )}

              {/* ✨ 當橡皮擦工具啟用時，在控制點顯示刪除按鈕 */}
              {activeTool === 'eraser' && !isDraft && (
                <g
                  className="cursor-pointer"
                  pointerEvents="all"
                  onMouseDown={(e) => { e.stopPropagation(); handleDeleteDrawing(drawObj.id); }}
                  onTouchStart={(e) => { e.stopPropagation(); handleDeleteDrawing(drawObj.id); }}
                >
                  <circle cx={pt.x} cy={pt.y} r={14} fill="#ef4444" opacity={0.6} className="hover:opacity-100 transition-opacity" />
                  <text x={pt.x} y={pt.y + 4} fontSize="12" fontWeight="bold" fill="#ffffff" textAnchor="middle" pointerEvents="none">✕</text>
                </g>
              )}
            </g>
          ))}
          
          {/* ✨ 整塊拖曳與複製的工具列 (微調模式專屬) */}
          {activeTool === 'edit' && !isDraft && pts.length > 0 && (
            <g transform={`translate(${pts[0].x}, ${pts[0].y - 30})`} pointerEvents="all">
              <rect x="-45" y="-14" width="90" height="28" fill="#1e293b" fillOpacity="0.95" rx="6" stroke={drawObj.color} strokeWidth="1.5" />
              
              {/* 🖐️ 移動整塊按鈕 */}
              <g className="cursor-move" 
                 onMouseDown={(e) => handleDragWholeStart(e, drawObj)}
                 onTouchStart={(e) => handleDragWholeStart(e, drawObj)}
              >
                <rect x="-45" y="-14" width="45" height="28" fill="transparent" />
                <text x="-22.5" y="4" fill="#38bdf8" fontSize="13" fontWeight="bold" textAnchor="middle">🖐️移動</text>
              </g>

              {/* 分隔線 */}
              <line x1="0" y1="-10" x2="0" y2="10" stroke="#475569" strokeWidth="1" />
              
              {/* 📄 複製按鈕 */}
              <g className="cursor-pointer"
                 onMouseDown={(e) => onCloneClick(e, drawObj)}
                 onTouchStart={(e) => onCloneClick(e, drawObj)}
              >
                <rect x="0" y="-14" width="45" height="28" fill="transparent" />
                <text x="22.5" y="4" fill="#f59e0b" fontSize="13" fontWeight="bold" textAnchor="middle">📄複製</text>
              </g>
            </g>
          )}
        </>
      );
    };

    // 👇👇👇 貼在這裡：渲染畫筆的邏輯 👇👇👇
    if (drawObj.type === 'pen') {
       return (
         <g key={idKey}>
           {pts.length > 1 && (
             <polyline 
               points={pts.map(p => `${p.x},${p.y}`).join(' ')} 
               fill="none" 
               stroke={drawObj.color} 
               strokeWidth={drawObj.width} 
               strokeLinecap="round" 
               strokeLinejoin="round" 
               opacity={isDraft ? baseOpacity * 0.6 : baseOpacity} 
               pointerEvents="none" 
             />
           )}
           {!isDraft && activeTool === 'eraser' && pts.length > 0 && (
             <g className="cursor-pointer" pointerEvents="all" onMouseDown={(e) => { e.stopPropagation(); handleDeleteDrawing(drawObj.id); }} onTouchStart={(e) => { e.stopPropagation(); handleDeleteDrawing(drawObj.id); }}>
               <circle cx={pts[Math.floor(pts.length/2)].x} cy={pts[Math.floor(pts.length/2)].y} r={14} fill="#ef4444" opacity={0.6} className="hover:opacity-100 transition-opacity" />
               <text x={pts[Math.floor(pts.length/2)].x} y={pts[Math.floor(pts.length/2)].y + 4} fontSize="12" fontWeight="bold" fill="#ffffff" textAnchor="middle" pointerEvents="none">✕</text>
             </g>
           )}
           {!isDraft && activeTool === 'edit' && pts.length > 0 && (
             <g transform={`translate(${pts[Math.floor(pts.length/2)].x}, ${pts[Math.floor(pts.length/2)].y - 30})`} pointerEvents="all">
               <rect x="-45" y="-14" width="90" height="28" fill="#1e293b" fillOpacity="0.95" rx="6" stroke={drawObj.color} strokeWidth="1.5" />
               <g className="cursor-move" onMouseDown={(e) => handleDragWholeStart(e, drawObj)} onTouchStart={(e) => handleDragWholeStart(e, drawObj)}>
                 <rect x="-45" y="-14" width="45" height="28" fill="transparent" />
                 <text x="-22.5" y="4" fill="#38bdf8" fontSize="13" fontWeight="bold" textAnchor="middle">🖐️移動</text>
               </g>
               <line x1="0" y1="-10" x2="0" y2="10" stroke="#475569" strokeWidth="1" />
               <g className="cursor-pointer" onMouseDown={(e) => onCloneClick(e, drawObj)} onTouchStart={(e) => onCloneClick(e, drawObj)}>
                 <rect x="0" y="-14" width="45" height="28" fill="transparent" />
                 <text x="22.5" y="4" fill="#f59e0b" fontSize="13" fontWeight="bold" textAnchor="middle">📄複製</text>
               </g>
             </g>
           )}
         </g>
       );
    }

    if (drawObj.type === 'crossline') {
      return (
        <g key={idKey}>
          {pts.length === 1 && (() => {
            const p = pts[0];
            return (
              <g>
                <line x1={0} y1={p.y} x2={width} y2={p.y} stroke={drawObj.color} strokeWidth={drawObj.width} opacity={isDraft ? baseOpacity * 0.6 : baseOpacity} pointerEvents="none" />
                <line x1={p.x} y1={padding} x2={p.x} y2={mainHeight + volHeight + indicatorHeight} stroke={drawObj.color} strokeWidth={drawObj.width} opacity={isDraft ? baseOpacity * 0.6 : baseOpacity} pointerEvents="none" />
              </g>
            )
          })()}
          {renderDots()}
        </g>
      )
    }

    if (drawObj.type === 'fibo') {
      return (
        <g key={idKey}>
          {pts.length === 2 && (() => {
            const p1 = pts[0]; const p2 = pts[1];
            const raw1 = rawPts[0]; const raw2 = rawPts[1];
            // ✨ 1. 斐波只保留 0, 0.382, 0.5, 0.618, 1
            const levels = [0, 0.382, 0.5, 0.618, 1];
            const diffY = p2.y - p1.y;
            const diffPrice = raw2.price - raw1.price;
            return (
              <g>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={drawObj.color} strokeWidth={1} strokeDasharray="4,4" opacity={isDraft ? baseOpacity * 0.6 : baseOpacity} pointerEvents="none" />
                {levels.map(lvl => {
                  const currPrice = raw1.price + diffPrice * lvl;
                  const currY = p1.y + diffY * lvl;
                  if (currY < 0 || currY > mainHeight + volHeight + indicatorHeight) return null;
                  return (
                    <g key={lvl}>
                      <line x1={0} y1={currY} x2={width} y2={currY} stroke={drawObj.color} strokeWidth={drawObj.width} opacity={isDraft ? baseOpacity * 0.4 : baseOpacity * 0.6} pointerEvents="none" />
                      {/* ✨ 2. 字體套用 fillOpacity 半透明效果，並將 x 座標退到 padding 內避免被裁切 */}
                      <text x={width - padding - 5} y={currY - 5} fill="#e2e8f0" fillOpacity={isDraft ? baseOpacity * 0.4 : baseOpacity * 0.6} fontSize="12" fontWeight="bold" textAnchor="end" pointerEvents="none">
                        {lvl} ({currPrice.toFixed(2)})
                      </text>
                    </g>
                  )
                })}
              </g>
            )
          })()}
          {renderDots()}
        </g>
      )
    }

    // === ✨ 新增：專用箱型測量框邏輯 ===
    if (drawObj.type === 'measure') {
       return (
         <g key={idKey}>
           {pts.length === 2 && (() => {
             const rx = Math.min(pts[0].x, pts[1].x), ry = Math.min(pts[0].y, pts[1].y);
             const rw = Math.abs(pts[1].x - pts[0].x), rh = Math.abs(pts[1].y - pts[0].y);
             const raw1 = rawPts[0]; const raw2 = rawPts[1];
             const priceDiff = raw2.price - raw1.price;
             const pct = (priceDiff / raw1.price) * 100;
             const sign = priceDiff > 0 ? '+' : '';
             const color = priceDiff >= 0 ? '#ef4444' : '#22c55e';
             const textStr = `${sign}${priceDiff.toFixed(2)} (${sign}${pct.toFixed(2)}%)`;
             
             // ✨ 3. 加入防碰撞邊界邏輯，確保資訊框不被裁切
             let boxX = rx + rw / 2;
             if (boxX - 85 < padding) boxX = padding + 85;
             if (boxX + 85 > width - padding) boxX = width - padding - 85;
             let boxY = ry - 12;
             if (boxY < padding + 12) boxY = padding + 12;
             
             return (
               <g>
                 <rect x={rx} y={ry} width={rw} height={rh} stroke={drawObj.color} strokeWidth={drawObj.width} fill={color} fillOpacity={0.15} opacity={isDraft ? baseOpacity * 0.6 : baseOpacity} pointerEvents="none" />
                 <line x1={pts[0].x} y1={pts[0].y} x2={pts[1].x} y2={pts[1].y} stroke={drawObj.color} strokeWidth={1} strokeDasharray="4,4" opacity={isDraft ? baseOpacity * 0.6 : baseOpacity} pointerEvents="none" />
                 <g transform={`translate(${boxX}, ${boxY})`}>
                    {/* ✨ 測量框背景加寬至 170px，並保持半透明 */}
                    <rect x="-85" y="-12" width="170" height="24" fill="#0f172a" fillOpacity="0.3" rx="4" stroke={drawObj.color} strokeWidth="1" strokeOpacity="0.4" pointerEvents="none" />
                    <text x="0" y="4" fill="#f8fafc" opacity="0.6" fontSize="12" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                       {textStr}
                    </text>
                 </g>
               </g>
             );
           })()}
           {renderDots()}
         </g>
       );
    }

    if (drawObj.type === 'segment') {
       return (
         <g key={idKey}>
           {pts.length === 2 && <line x1={pts[0].x} y1={pts[0].y} x2={pts[1].x} y2={pts[1].y} stroke={drawObj.color} strokeWidth={drawObj.width} opacity={isDraft ? baseOpacity * 0.6 : baseOpacity} pointerEvents="none" />}
           {renderDots()}
         </g>
       );
    }
    
    // === ➡️ 箭頭繪製邏輯 ===
    if (drawObj.type === 'arrow') {
       return (
         <g key={idKey}>
           {pts.length === 2 && (() => {
             const p1 = pts[0];
             const p2 = pts[1];
             const dx = p2.x - p1.x;
             const dy = p2.y - p1.y;
             const angle = Math.atan2(dy, dx);
             // 計算箭頭的長度與角度 (根據線條粗細稍微調整大小)
             const headlen = 12 + drawObj.width * 2.5; 
             const p3x = p2.x - headlen * Math.cos(angle - Math.PI / 6);
             const p3y = p2.y - headlen * Math.sin(angle - Math.PI / 6);
             const p4x = p2.x - headlen * Math.cos(angle + Math.PI / 6);
             const p4y = p2.y - headlen * Math.sin(angle + Math.PI / 6);

             return (
               <>
                 <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={drawObj.color} strokeWidth={drawObj.width} opacity={isDraft ? baseOpacity * 0.6 : baseOpacity} pointerEvents="none" />
                 <polygon points={`${p2.x},${p2.y} ${p3x},${p3y} ${p4x},${p4y}`} fill={drawObj.color} opacity={isDraft ? baseOpacity * 0.6 : baseOpacity} pointerEvents="none" />
               </>
             );
           })()}
           {renderDots()}
         </g>
       );
    }

    if (drawObj.type === 'trend') {
       return (
         <g key={idKey}>
           {pts.length === 2 && (() => {
             const m = (pts[1].y - pts[0].y) / (pts[1].x - pts[0].x || 0.001); const b = pts[0].y - m * pts[0].x;
             return <line x1={0} y1={b} x2={width} y2={m * width + b} stroke={drawObj.color} strokeWidth={drawObj.width} opacity={isDraft ? baseOpacity * 0.6 : baseOpacity} pointerEvents="none" />;
           })()}
           {renderDots()}
         </g>
       );
    }
    
    if (drawObj.type === 'rect') {
       return (
         <g key={idKey}>
           {pts.length === 2 && (() => {
             const rx = Math.min(pts[0].x, pts[1].x), ry = Math.min(pts[0].y, pts[1].y);
             const rw = Math.abs(pts[1].x - pts[0].x), rh = Math.abs(pts[1].y - pts[0].y);
             return <rect x={rx} y={ry} width={rw} height={rh} stroke={drawObj.color} strokeWidth={drawObj.width} fill={drawObj.color} fillOpacity={0.15} opacity={isDraft ? baseOpacity * 0.6 : baseOpacity} pointerEvents="none" />;
           })()}
           {renderDots()}
         </g>
       );
    }
    
    if (drawObj.type === 'text' && pts.length === 1) {
       return (
         <g key={idKey}>
           <text x={pts[0].x} y={pts[0].y} fill={drawObj.color} fontSize={drawObj.size} fontWeight="bold" opacity={isDraft ? baseOpacity * 0.6 : baseOpacity} pointerEvents="none">{drawObj.text}</text>
           {renderDots()}
         </g>
       );
    }
    
    if (drawObj.type === 'n-shape') {
      const A = pts[0]; 
      const B = pts.length >= 2 ? pts[1] : null; 
      const C = pts.length === 3 ? pts[2] : null;
      
      return (
        <g key={idKey} opacity={isDraft ? baseOpacity * 0.6 : baseOpacity} pointerEvents="none">
          {renderDots()}
          {B && <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={drawObj.color} strokeWidth={drawObj.width} strokeDasharray="4,4" />}
          {B && C && <line x1={B.x} y1={B.y} x2={C.x} y2={C.y} stroke={drawObj.color} strokeWidth={drawObj.width} strokeDasharray="4,4" />}
          
          {B && C && (() => {
             const diff = rawPts[1].price - rawPts[0].price; 
             const maxTarget = rawPts[2].price + diff * 2; 
             let maxY = getY(maxTarget);
             
             if(maxY < padding) maxY = padding; 
             if(maxY > mainHeight - padding) maxY = mainHeight - padding;
             
             return (
               <g>
                 <line x1={C.x} y1={C.y} x2={C.x} y2={maxY} stroke={drawObj.color} strokeWidth={drawObj.width} strokeDasharray="6,4" />
                 
                 {[1, 1.5, 1.618, 2].map(k => {
                    const tPrice = rawPts[2].price + diff * k; 
                    let ty = getY(tPrice); 
                    let isClamped = false;
                    
                    if (ty < padding + 15) { ty = padding + 15; isClamped = true; }
                    if (ty > mainHeight - padding) { ty = mainHeight - padding - 5; isClamped = true; }
                    
                    return (
                      <g key={k}>
                        <line x1={C.x - 40} y1={ty} x2={C.x} y2={ty} stroke={drawObj.color} strokeWidth={drawObj.width} />
                        <rect x={C.x - 145} y={ty - 13} width={100} height={26} fill={'#0f172a'} fillOpacity="0.9" rx="4" />
                        <text x={C.x - 48} y={ty + 5} fill={drawObj.color} fontSize="13" fontWeight="bold" textAnchor="end">
                           {isClamped ? `(超出) ` : ''}T{k}: {tPrice.toFixed(2)}
                        </text>
                      </g>
                    );
                 })}
               </g>
             );
          })()}
        </g>
      );
    }

    // === ✨ 新增：波段對照工具 (wave) ===
    if (drawObj.type === 'wave') {
      return (
        <g key={idKey} opacity={isDraft ? baseOpacity * 0.6 : baseOpacity} pointerEvents="none">
          {renderDots()}
          {/* 繪製波段連線 */}
          {pts.map((p, i) => {
            if (i === 0) return null;
            return <line key={`wave-line-${i}`} x1={pts[i-1].x} y1={pts[i-1].y} x2={p.x} y2={p.y} stroke={drawObj.color} strokeWidth={drawObj.width} strokeDasharray={isDraft ? "4,4" : ""} />;
          })}
          
          {/* 顯示波段分析資訊 */}
          {(() => {
            const waves = [];
            for(let i=1; i<rawPts.length; i++) {
                const p0 = rawPts[i-1];
                const p1 = rawPts[i];
                let idx0 = data.length - 1 - p0.idxFromEnd;
                let idx1 = data.length - 1 - p1.idxFromEnd;
                if (idx0 > idx1) { const t = idx0; idx0 = idx1; idx1 = t; } // 保證時間順序
                
                const diff = p1.price - p0.price;
                const absDiff = Math.abs(diff);
                const bars = Math.max(1, idx1 - idx0);
                
                let totalVol = 0;
                for(let j=idx0; j<=idx1; j++) {
                  if(data[j]) totalVol += data[j].volume;
                }
                const avgVol = totalVol / bars;
                // 取得波段起點與終點的 5MV 均量線 (程式中對應的是 vma1)
                const startVma5 = data[idx0] && data[idx0].vma1 !== null ? data[idx0].vma1 : 0;
                const endVma5 = data[idx1] && data[idx1].vma1 !== null ? data[idx1].vma1 : 0;

                waves.push({ 
                    diff, absDiff, bars, totalVol, avgVol, 
                    dir: diff >= 0 ? 'up' : 'down',
                    isVmaUp: endVma5 >= startVma5 // 判斷波段結束時的 5MV 是否大於等於起點的 5MV (向上揚)
                });
            }

            return waves.map((w, i) => {
                const labels = [];
                const pct = (w.diff / rawPts[i].price) * 100;
                labels.push(`幅: ${w.diff>0?'+':''}${w.diff.toFixed(2)} (${pct>0?'+':''}${pct.toFixed(1)}%)`);
                
                // === 異位對照邏輯 ===
                if (i >= 1) {
                  const prev = waves[i-1];
                  const isVolInc = w.isVmaUp; // 如果 5MV 向上揚就是量增，向下彎就是量縮
                  const isAmpInc = w.absDiff > prev.absDiff;
                  let text = '';
                  if (w.dir === 'up') {
                      text = (isVolInc ? "量增" : "量縮") + (isAmpInc ? "價漲角度陡" : "價彈角度緩");
                  } else {
                      text = (isVolInc ? "量增" : "量縮") + (isAmpInc ? "價跌角度陡" : "價跌角度緩");
                  }
                  labels.push(`[異位] ${text}`);
                }

                // === 同位對照邏輯 ===
                if (i >= 2) {
                  const prevPrev = waves[i-2];
                  if (w.dir === prevPrev.dir) {
                      const ampCmp = w.absDiff > prevPrev.absDiff ? '強' : '弱';
                      const volCmp = w.isVmaUp ? '增' : '縮';
                      labels.push(`[同位] 幅度${ampCmp} / 量${volCmp}`);
                  }
                }

                // 將資訊框放置在線段中點旁邊
                const p0 = pts[i];
                const p1 = pts[i+1];
                if (!p1) return null;
                const midX = (p0.x + p1.x) / 2;
                const midY = (p0.y + p1.y) / 2;
                
                const boxHeight = labels.length * 16 + 8;
                const boxWidth = 160;
                const offsetY = w.dir === 'up' ? -boxHeight/2 - 60 : boxHeight/2 + 60;

                return (
                  <g key={`wave-info-${i}`}>
                    {/* 1. 畫一條虛線，從原本線段的中點(midX, midY) 連到 說明框的位置(midX, midY + offsetY) */}
                    <line 
                      x1={midX} y1={midY} 
                      x2={midX} y2={midY + offsetY} 
                      stroke={drawObj.color} 
                      strokeWidth="1" 
                      strokeDasharray="4,4" 
                      opacity="0.6" 
                    />
    
                    {/* 2. 原本的說明框維持平移，並放在虛線的下一層 */}
                    <g transform={`translate(${midX}, ${midY + offsetY})`}>
                      <rect x={-boxWidth/2} y={-boxHeight/2} width={boxWidth} height={boxHeight} fill="#0f172a" fillOpacity="0.8" rx="6" stroke={drawObj.color} strokeWidth="1" strokeOpacity="0.6" />
                      {labels.map((lb, lIdx) => (
                        <text key={lIdx} x={0} y={-boxHeight/2 + 15 + lIdx * 16} fill={lIdx === 0 ? "#f8fafc" : (lIdx === 1 ? "#fbbf24" : "#a78bfa")} fontSize="11" fontWeight="bold" textAnchor="middle">{lb}</text>
                      ))}
                    </g>
                  </g>
                );
            });
          })()}
        </g>
      );
    }
    return null;
  };

  // ✨ 固定暗黑科技主題
  const theme = {
    bg: '#0f172a',
    grid: '#1e293b',
    text: '#94a3b8',
    title: '#38bdf8',
    crosshairLine: '#38bdf8',
    crosshairBg: '#0ea5e9',
    crosshairText: '#0f172a',
    tooltipBg: 'rgba(15, 23, 42, 0.90)',
    tooltipBorder: '#0ea5e9',
    tooltipText1: '#94a3b8',
    tooltipText2: '#e2e8f0',
    heidunText: '#f8fafc'
  };

  // ✨ 週期文字標籤
  const tfLabel = timeframe === 'W' ? '週' : timeframe === 'M' ? '月' : '日';
  
  // ✨ 抓取當前應顯示的 MA 數值
  const displayIdx = crosshair && crosshair.idx >= 0 && crosshair.idx < data.length ? crosshair.idx : data.length - 1;
  const currentHoverData = data[displayIdx];

  return (
    <div ref={chartContainerRef} className={isFullscreen ? "fixed inset-0 z-[100] bg-[#020617] flex flex-col w-full h-full" : `relative rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.1)] border border-cyan-900/50 bg-[#0f172a] h-full flex flex-col`}>
      <CustomModal modal={chartModal} />
      
      {/* ✨ 排行榜視窗被安置在全螢幕容器內部，保證絕不會被遮擋 */}
      {rankingModalContent}

      {/* ✨ 2. 次級功能列 (滑桿、翻轉、畫板、存圖) */}
      <div className="flex items-center justify-between px-2 sm:px-3 py-2 shrink-0 border-b border-cyan-900/50 bg-slate-900/60 relative z-20 shadow-sm overflow-x-auto [&::-webkit-scrollbar]:hidden w-full">
         
         {/* ✨ 新增：K棒數量縮放滑桿 */}
         <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/80 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-600 shrink-0 shadow-inner mr-auto">
           <span className="text-cyan-400 text-xs font-bold whitespace-nowrap">🔎 視角</span>
           <input type="range" min="30" max="300" step="10" value={displayCount} onChange={(e) => { setDisplayCount(Number(e.target.value)); }} className="w-20 sm:w-32 accent-cyan-500 cursor-pointer" />
           <span className="text-slate-300 text-xs font-bold w-6">{displayCount}</span>
         </div>

         <div className="flex gap-1.5 sm:gap-2 z-10 shrink-0">
           <button onClick={toggleFullscreen} className="justify-center bg-slate-800/80 border border-slate-600 text-cyan-400 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold shadow-[0_0_10px_rgba(8,145,178,0.2)] hover:bg-slate-700 whitespace-nowrap transition-all flex items-center">
             {isFullscreen ? '↙️ 退出' : '🔲 翻轉/全螢幕'}
           </button>
           {/* 👇 貼在這裡：專屬的查價線獨立開關 👇 */}
           <button onClick={onToggleCrosshair} className={`justify-center px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center border ${toggles.showCrosshair !== false ? 'bg-pink-900/80 border-pink-500 text-pink-200 shadow-[0_0_10px_rgba(236,72,153,0.4)]' : 'bg-slate-800/80 border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-pink-300'}`}>
             {toggles.showCrosshair !== false ? '🎯 關查價' : '🎯 開查價'}
           </button>
           <button onClick={() => setIsLayoutModalOpen(true)} className="justify-center bg-indigo-900/50 border border-indigo-700 text-indigo-300 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold shadow-[0_0_10px_rgba(99,102,241,0.2)] hover:bg-indigo-800 whitespace-nowrap transition-all flex items-center">
             📁 畫板
           </button>
           <button onClick={handleDownloadImage} className="justify-center bg-cyan-900/50 border border-cyan-700 text-cyan-300 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)] hover:bg-cyan-800 whitespace-nowrap transition-all flex items-center">
             📸 存圖
           </button>
           {/* ✨ 移過來的：漲幅排行/AI名單 按鈕 */}
            {rankingList && rankingList.length > 0 && (
              <button onClick={onOpenRanking} className="justify-center bg-pink-900/50 border border-pink-700 text-pink-300 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold shadow-[0_0_10px_rgba(236,72,153,0.2)] hover:bg-pink-800 whitespace-nowrap transition-all flex items-center">
                🏆 漲幅排行
              </button>
            )}
         </div>         
      </div>

      {/* ✨ 工具箱 (改為 fixed 懸浮，無論如何滑動都不會消失出螢幕) */}
      {isToolbarOpen ? (
        <div style={{left: toolbarPos.x, top: toolbarPos.y}} className="fixed z-[150] bg-slate-900 border border-cyan-800 shadow-[0_0_30px_rgba(8,145,178,0.3)] rounded-xl flex flex-col w-[310px]">
          <div onMouseDown={startDragToolbar} onTouchStart={startDragToolbar} className="bg-slate-800 border-b border-cyan-900 text-cyan-400 text-xs px-3 py-2 rounded-t-xl cursor-move flex justify-between items-center touch-none">
            <span className="font-bold tracking-widest">🛠️ DRAWING TOOLS</span>
            <button onClick={()=>setIsToolbarOpen(false)} className="text-slate-400 hover:text-cyan-300 font-bold px-1 transition-colors">➖ 收起</button>
          </div>
          <div className="p-3 flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              <button onClick={()=> {setActiveTool('cursor'); setDraftPoints([]);}} className={`px-2 py-1 text-sm rounded font-bold border transition-colors ${activeTool === 'cursor' ? 'bg-cyan-700 text-white border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}`}>🖱️ 游標</button>

              <button onClick={()=> {setActiveTool('pen'); setDraftPoints([]);}} className={`px-2 py-1 text-sm rounded font-bold border transition-colors ${activeTool === 'pen' ? 'bg-cyan-700 text-white border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}`}>🖍️ 畫筆</button>

              <button onClick={()=>setActiveTool('segment')} className={`px-2 py-1 text-sm rounded font-bold border transition-colors ${activeTool === 'segment' ? 'bg-cyan-700 text-white border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}`}>📏 線段</button>
              
              <button onClick={()=>setActiveTool('arrow')} className={`px-2 py-1 text-sm rounded font-bold border transition-colors ${activeTool === 'arrow' ? 'bg-cyan-700 text-white border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}`}>➡️ 箭頭</button>
              
              <button onClick={()=>setActiveTool('trend')} className={`px-2 py-1 text-sm rounded font-bold border transition-colors ${activeTool === 'trend' ? 'bg-cyan-700 text-white border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}`}>↗️ 趨勢</button>
              
              {/* ✨ 新增的工具 */}
              <button onClick={()=>setActiveTool('wave')} className={`px-2 py-1 text-sm rounded font-bold border transition-colors ${activeTool === 'wave' ? 'bg-cyan-700 text-white border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}`}>🌊 波段</button>
              
              {/* ✨ 新增的兩個工具 */}
              <button onClick={()=>setActiveTool('fibo')} className={`px-2 py-1 text-sm rounded font-bold border transition-colors ${activeTool === 'fibo' ? 'bg-cyan-700 text-white border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}`}>📐 斐波</button>
              <button onClick={()=>setActiveTool('measure')} className={`px-2 py-1 text-sm rounded font-bold border transition-colors ${activeTool === 'measure' ? 'bg-cyan-700 text-white border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}`}>📏 測量</button>
              <button onClick={()=>setActiveTool('crossline')} className={`px-2 py-1 text-sm rounded font-bold border transition-colors ${activeTool === 'crossline' ? 'bg-cyan-700 text-white border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}`}>➕ 十字</button>

              <button onClick={()=>setActiveTool('rect')} className={`px-2 py-1 text-sm rounded font-bold border transition-colors ${activeTool === 'rect' ? 'bg-cyan-700 text-white border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}`}>🔲 矩形</button>
              <button onClick={()=>setActiveTool('n-shape')} className={`px-2 py-1 text-sm rounded font-bold border transition-colors ${activeTool === 'n-shape' ? 'bg-cyan-700 text-white border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}`}>⚡ N型</button>
              <button onClick={()=>setActiveTool('text')} className={`px-2 py-1 text-sm rounded font-bold border transition-colors ${activeTool === 'text' ? 'bg-cyan-700 text-white border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}`}>🔤 文字</button>
              <button onClick={()=> {setActiveTool('edit'); setDraftPoints([]);}} className={`px-2 py-1 text-sm rounded font-bold border transition-colors ${activeTool === 'edit' ? 'bg-amber-600 text-white border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}`}>🖐️ 微調</button>
              <button onClick={()=> {setActiveTool('eraser'); setDraftPoints([]);}} className={`px-2 py-1 text-sm rounded font-bold border transition-colors ${activeTool === 'eraser' ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.4)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}`}>🧽 橡皮擦</button>

              <div className="w-[1px] h-6 bg-slate-700 mx-1 self-center"></div>

              <button onClick={() => setIsMagnetOn(!isMagnetOn)} className={`px-2 py-1 text-sm rounded font-bold border flex items-center gap-1 transition-colors ${isMagnetOn ? 'bg-red-900/50 text-red-400 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}`} title="開啟後強制吸附K棒最高/最低點">
                🧲 磁吸 {isMagnetOn ? 'ON' : 'OFF'}
              </button>

            </div>
            
            <div className="flex flex-col gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700">
              <div className="flex flex-wrap gap-1.5 items-center">
                {/* ✨ 新增黃色、深藍、粉紅、白色 */}
                {['#ef4444', '#22c55e', '#38bdf8', '#a855f7', '#f59e0b', '#0f172a', '#ffffff', '#eab308', '#2563eb', '#ec4899'].map(color => (
                  <button key={color} onClick={()=>setDrawColor(color)} className={`w-5 h-5 rounded-full border-2 transition-transform ${drawColor === color ? 'border-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'border-transparent'}`} style={{backgroundColor: color}}></button>
                ))}
              </div>
              <div className="flex justify-between items-center w-full">
                <div className="flex gap-1">
                  {[1, 2, 4].map(w => (
                    <button key={w} onClick={()=>setDrawWidth(w)} className={`px-2 py-0.5 text-xs font-bold rounded border transition-colors ${drawWidth === w ? 'bg-slate-600 border-slate-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>{w}px</button>
                  ))}
                </div>
              </div>
            </div>

            {/* ✨ 新增透明度調整拉桿 */}
            <div className="flex flex-col gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700 mt-1">
              <div className="flex justify-between items-center w-full gap-2">
                <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">透明度</span>
                <input type="range" min="0.1" max="1" step="0.1" value={drawOpacity} onChange={(e) => setDrawOpacity(Number(e.target.value))} className="w-full accent-cyan-500 cursor-pointer" />
                <span className="text-[10px] text-slate-300 w-8 text-right font-bold">{Math.round(drawOpacity * 100)}%</span>
              </div>
            </div>

            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-2">
                <button onClick={handleUndo} disabled={historyStep <= 0} className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-300 text-sm font-bold hover:bg-slate-700 disabled:opacity-30 transition-colors">↩️ 上一步</button>
                <button onClick={handleRedo} disabled={historyStep >= history.length - 1} className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-300 text-sm font-bold hover:bg-slate-700 disabled:opacity-30 transition-colors">↪️ 下一步</button>
              </div>
              <button onClick={handleClearAll} className="text-sm text-red-400 hover:text-red-300 font-bold bg-red-950/30 border border-red-900/50 px-2 py-1 rounded transition-colors">🗑️ 全清</button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{left: toolbarPos.x, top: toolbarPos.y}} className="fixed z-[150] bg-slate-800 border border-cyan-800 text-white p-3 rounded-full shadow-[0_0_20px_rgba(8,145,178,0.4)] cursor-pointer hover:bg-slate-700 transition-colors opacity-80 hover:opacity-100" onClick={()=>setIsToolbarOpen(true)} title="展開畫線工具箱">
          🛠️
        </div>
      )}

      {/* ✨ 畫板管理彈窗 Layout Manager Modal */}
      {isLayoutModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-[#0f172a] border border-cyan-800 shadow-[0_0_30px_rgba(8,145,178,0.4)] rounded-xl w-full max-w-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-700 p-4">
              <h3 className="text-xl font-bold text-cyan-400 flex items-center gap-2"><span>📁</span> 雲端畫板管理</h3>
              <button onClick={() => setIsLayoutModalOpen(false)} className="text-slate-400 hover:text-white bg-slate-800 px-3 py-1 rounded font-bold">✕ 關閉</button>
            </div>
            
            <div className="p-4 flex flex-col gap-4 overflow-hidden h-full">
              {/* 儲存當前版面區塊 */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-600 flex flex-col sm:flex-row gap-3 items-end shrink-0">
                <div className="flex-1 w-full">
                  <label className="text-sm text-slate-300 font-bold block mb-1">將目前畫面 (<span className="text-cyan-400">{stockName} {tfLabel}K</span>) 存為新畫板：</label>
                  <input type="text" id="layout-name-input" placeholder="例如：台積電多頭支撐分析" className="w-full bg-slate-900 border border-slate-600 focus:border-cyan-500 p-2.5 rounded-lg text-cyan-300 outline-none font-bold placeholder-slate-600" onKeyDown={(e) => { if(e.key==='Enter') document.getElementById('save-layout-btn').click(); }} />
                </div>
                <button id="save-layout-btn" onClick={() => {
                  const name = document.getElementById('layout-name-input').value;
                  if(!name.trim()) return showAlert('請輸入畫板名稱');
                  const newLayout = {
                    id: Date.now(),
                    name: name.trim(),
                    realSymbol,
                    symbolFullName: stockName,
                    timeframe,
                    drawings: drawings,
                    date: new Date().toLocaleString('zh-TW', {hour12: false})
                  };
                  setSavedLayouts([newLayout, ...savedLayouts]);
                  document.getElementById('layout-name-input').value = '';
                }} className="bg-cyan-700 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-cyan-600 shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all w-full sm:w-auto">💾 儲存</button>
              </div>

              {/* 已儲存畫板列表 */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-track]:bg-slate-800/50">
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">已儲存的畫板庫</div>
                {savedLayouts.map(l => (
                  <div key={l.id} className="bg-[#1e293b] border border-slate-700/80 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-cyan-800 transition-colors group">
                    <div className="flex-1">
                      <div className="font-bold text-cyan-300 text-base">{l.name}</div>
                      <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="bg-slate-900 px-2 py-0.5 rounded text-indigo-300 border border-slate-700">{l.symbolFullName}</span>
                        <span className="bg-slate-900 px-2 py-0.5 rounded text-amber-300 border border-slate-700">{l.timeframe === 'W' ? '週K' : l.timeframe === 'M' ? '月K' : '日K'}</span>
                        <span>{l.drawings.length} 個圖形</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-slate-500">{l.date}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={() => {
                        setIsLayoutModalOpen(false);
                        onLoadLayout(l);
                      }} className="flex-1 sm:flex-none bg-emerald-900/60 text-emerald-400 border border-emerald-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-800 hover:text-white transition-colors shadow-sm">📂 載入</button>
                      <button onClick={() => {
                        setChartModal({
                          type: 'confirm', message: `確定要刪除畫板「${l.name}」嗎？`,
                          onConfirm: () => { setSavedLayouts(savedLayouts.filter(sl => sl.id !== l.id)); setChartModal(null); },
                          onCancel: () => setChartModal(null)
                        });
                      }} className="sm:opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 bg-red-950/30 px-3 py-2 rounded-lg text-sm font-bold transition-all">刪除</button>
                    </div>
                  </div>
                ))}
                {savedLayouts.length === 0 && (
                  <div className="text-center text-slate-500 py-10 flex flex-col items-center gap-2">
                    <span className="text-4xl">🗂️</span>
                    <span>目前沒有儲存的畫板</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✨ 浮動的「結束畫線」緊急按鈕，確保手機用戶在任何情況下都能恢復滑動畫面 */}
      {activeTool !== 'cursor' && (
        <button
          onClick={() => { setActiveTool('cursor'); setDraftPoints([]); }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[120] bg-cyan-800/90 border border-cyan-400 text-cyan-100 px-6 py-3 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.6)] font-bold backdrop-blur-md hover:bg-cyan-700 transition-all flex items-center gap-2 pointer-events-auto"
        >
          🖱️ 結束畫線 (返回游標)
        </button>
      )}

      {/* ✨ 移除 touch-none，讓游標模式可以原生水平滑動 */}
      <div 
        ref={scrollContainerRef}
        className={`${isFullscreen ? "flex-1" : ""} overflow-x-auto p-2 pt-1 relative ${(activeTool !== 'cursor' || toggles.showCrosshair) ? 'touch-none' : ''} h-full flex flex-col`}
      >
        
        {activeTool !== 'cursor' && activeTool !== 'edit' && activeTool !== 'eraser' && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-cyan-300 font-bold bg-slate-800/80 backdrop-blur-sm border border-cyan-800 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.2)] text-sm pointer-events-none z-10">
            ✏️ 作圖模式：拖曳放開即畫完
          </div>
        )}

        {/* ✨ 動態切換 className 讓全圖模式可以完美縮進單一螢幕裡 */}
        {/* ✨ 解除畫布高度與寬度限制，完全貼合手機螢幕不留白 */}
        <svg id="trend-chart-svg" ref={svgRef} viewBox={`0 0 ${width} ${totalSVGHeight}`} 
          className={`select-none ${activeTool !== 'cursor' ? 'cursor-crosshair' : 'cursor-default'}`} 
          style={{ width: width, minWidth: width, height: totalSVGHeight }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove} 
          onMouseUp={handlePointerUp}
          onMouseLeave={(e) => { setCrosshair(null); setHoverPoint(null); handlePointerUp(e); }}
          onTouchStart={handlePointerDown} 
          onTouchMove={handlePointerMove} 
          onTouchEnd={handlePointerUp}
          onTouchCancel={handlePointerUp}
        >
          <defs><clipPath id="chartClip"><rect x={padding} y={0} width={width - padding * 2} height={totalSVGHeight} /></clipPath></defs>
          <rect x={0} y={0} width={width} height={totalSVGHeight} fill="#0f172a" />
          
          {/* 將股名與週期寫入 SVG 畫布，確保存圖時會一併匯出 */}
          <text id="chart-title" x={width / 2} y={45} fill="#67e8f9" fontSize="22" fontWeight="bold" opacity="0.85" textAnchor="middle" pointerEvents="none">
            {stockName} ({timeframe === 'D' ? '日K' : timeframe === 'W' ? '週K' : '月K'})
          </text>
          
          <g clipPath="url(#chartClip)">
            
            {/* ✨ 補回：最高最低價參考線與天量防守線 */}
            <line x1={0} y1={getY(minPrice)} x2={width} y2={getY(minPrice)} stroke="#1e293b" strokeDasharray="4,4" />
            <line x1={0} y1={getY(maxPrice)} x2={width} y2={getY(maxPrice)} stroke="#1e293b" strokeDasharray="4,4" />
            
            {toggles.showVolSignal && defensivePrice && (() => {
              const latestX = padding + (data.length - 1) * spacing + spacing / 2;
              return (
                <g>
                  <line x1={0} y1={getY(defensivePrice)} x2={width} y2={getY(defensivePrice)} stroke="#ef4444" strokeDasharray="6,4" strokeWidth="1.5" opacity="0.8" />
                  <text x={Math.min(latestX + 10, width - 80)} y={getY(defensivePrice) - 6} fill="#ef4444" fontSize="14" fontWeight="bold" textAnchor="start">
                    🛡️ {defensivePrice.toFixed(2)}
                  </text>
                </g>
              );
            })()}

            {/* 獨立開關的主圖 MA */}
            {toggles.showMA && maParams.ma1.show !== false && <path d={getLinePath(data, 'ma1')} stroke={maParams.ma1.c} strokeWidth={maParams.ma1.w} fill="none" opacity="0.8"/>}
            {toggles.showMA && maParams.ma2.show !== false && <path d={getLinePath(data, 'ma2')} stroke={maParams.ma2.c} strokeWidth={maParams.ma2.w} fill="none" opacity="0.8"/>}
            {toggles.showMA && maParams.ma3.show !== false && <path d={getLinePath(data, 'ma3')} stroke={maParams.ma3.c} strokeWidth={maParams.ma3.w} fill="none" opacity="0.8"/>}

            {toggles.showBBands && (<g opacity="0.6">
                <path d={data.map((d, i) => d.bbands?.up != null ? `${i===0 || data[i-1]?.bbands?.up == null ? 'M' : 'L'} ${padding + i*spacing + spacing/2} ${getY(d.bbands.up)}` : '').join(' ')} stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4,4" fill="none" />
                <path d={data.map((d, i) => d.bbands?.mid != null ? `${i===0 || data[i-1]?.bbands?.mid == null ? 'M' : 'L'} ${padding + i*spacing + spacing/2} ${getY(d.bbands.mid)}` : '').join(' ')} stroke="#d8b4fe" strokeWidth="1" fill="none" />
                <path d={data.map((d, i) => d.bbands?.down != null ? `${i===0 || data[i-1]?.bbands?.down == null ? 'M' : 'L'} ${padding + i*spacing + spacing/2} ${getY(d.bbands.down)}` : '').join(' ')} stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4,4" fill="none" />
            </g>)}
            {/* ✨ 新增：繪製 高布林(3.0) 的上軌與下軌 (使用不同的粉紅色與虛線樣式區分) */}
            {toggles.showBBands3 && (<g opacity="0.5">
                <path d={data.map((d, i) => d.bbands?.up3 != null ? `${i===0 || data[i-1]?.bbands?.up3 == null ? 'M' : 'L'} ${padding + i*spacing + spacing/2} ${getY(d.bbands.up3)}` : '').join(' ')} stroke="#f472b6" strokeWidth="1.5" strokeDasharray="2,4" fill="none" />
                <path d={data.map((d, i) => d.bbands?.down3 != null ? `${i===0 || data[i-1]?.bbands?.down3 == null ? 'M' : 'L'} ${padding + i*spacing + spacing/2} ${getY(d.bbands.down3)}` : '').join(' ')} stroke="#f472b6" strokeWidth="1.5" strokeDasharray="2,4" fill="none" />
            </g>)}

            {/* ✨ 新增：布林帶寬壓縮區塊標示 (連續10天，帶寬<=1.5%) */}
            {toggles.showBBandsCompress && (
              <g>
                {(() => {
                  const zones = [];
                  let startIdx = -1;
                  let count = 0;
                  
                  // 1. 掃描全部的 K 線資料
                  data.forEach((d, i) => {
                    if (d.bbands?.up != null && d.bbands?.down != null && d.bbands?.mid != null) {
                      // ✨ 阿水布林帶寬公式： (上軌 - 下軌) / 中軌
                      const bandwidth = (d.bbands.up - d.bbands.down) / d.bbands.mid;
                      
                      // ✨ 判斷阿水帶寬是否在 0.15 (15%) 的極度壓縮範圍內
                      if (bandwidth <= 0.15) {
                        if (startIdx === -1) startIdx = i; // 記錄壓縮開始的第一天
                        count++;
                      } else {
                        // 如果壓縮中斷了，檢查剛剛是不是已經連續超過 10 天
                        // 💡 如果你想改成連續 5 天就顯示，就把這裡的 10 改成 5
                        if (count >= 10) {
                          zones.push({ start: startIdx, end: i - 1 });
                        }
                        // 重置計數器
                        startIdx = -1;
                        count = 0;
                      }
                    } else {
                        if (count >= 10) zones.push({ start: startIdx, end: i - 1 });
                        startIdx = -1;
                        count = 0;
                    }
                  });
                  
                  // 處理到最後一天如果還在壓縮狀態
                  if (count >= 10) {
                    zones.push({ start: startIdx, end: data.length - 1 });
                  }

                  // 2. 把符合條件的區塊，畫成半透明的黃色大方塊
                  return zones.map((z, idx) => {
                    // X 座標：區塊第一根 K 棒的位置
                    const rectX = padding + z.start * spacing;
                    // 寬度：涵蓋的 K 棒數量 * 間距
                    const rectWidth = (z.end - z.start + 1) * spacing;
                    
                    return (
                      <rect 
                        key={`compress-${idx}`} 
                        x={rectX} 
                        y={0} 
                        width={rectWidth} 
                        height={mainHeight} 
                        fill="rgba(234, 179, 8, 0.15)" // ✨ 帶有質感的半透明黃色
                        pointerEvents="none" 
                      />
                    );
                  });
                })()}
              </g>
            )}

            {/* 標準 K 線 (拔除了與寶塔線衝突的邏輯) */}
            {data.map((d, i) => {
              const x = padding + i * spacing + spacing / 2;
              const color = d.close >= d.open ? '#ef4444' : '#22c55e';
              return (
                <g key={`candle-${i}`}>
                  <line x1={x} y1={getY(d.high)} x2={x} y2={getY(d.low)} stroke={color} strokeWidth="1" />
                  <rect x={x - candleWidth / 2} y={getY(Math.max(d.open, d.close))} width={candleWidth} height={Math.max(1, getY(Math.min(d.open, d.close)) - getY(Math.max(d.open, d.close)))} fill={color} />
                  {/* ✨ 補回：黑頓與自訂策略標記 */}
                  <g textAnchor="middle" fontSize="12" fontWeight="bold">
                    {toggles.showHeidun && d.signalHeidun && <text x={x} y={getY(d.high) - 10} fill="#f8fafc">黑頓</text>}
                    {d.customMarks && d.customMarks.map((mark, markIdx) => <text key={markIdx} x={x} y={getY(d.high) - 10 - (toggles.showHeidun && d.signalHeidun ? 15 : 0) - (markIdx * 15)} fill="#818cf8">{mark}</text>)}
                  </g>
                  {/* ✨ 補回：起漲標記 */}
                  {toggles.showTrend && d.signalTrend && <text x={x} y={getY(d.low) + 15} fontSize="14" textAnchor="middle">🔺</text>}
                  {/* 獨立開關的 MA 圓點 */}
                  {toggles.showMA && maParams.ma1.show !== false && i === data.length - maParams.ma1.p - 1 && <circle cx={x} cy={getY(d.close)} r="3" fill={maParams.ma1.c} />}
                  {toggles.showMA && maParams.ma2.show !== false && i === data.length - maParams.ma2.p - 1 && <circle cx={x} cy={getY(d.close)} r="3" fill={maParams.ma2.c} />}
                  {toggles.showMA && maParams.ma3.show !== false && i === data.length - maParams.ma3.p - 1 && <circle cx={x} cy={getY(d.close)} r="3" fill={maParams.ma3.c} />}
                </g>
              );
            })}
          </g>

          <g transform={`translate(0, ${mainHeight})`} clipPath="url(#chartClip)">
            {data.map((d, i) => <rect key={`vol-${i}`} x={padding + i * spacing + spacing / 2 - candleWidth / 2} y={getVolY(d.volume)} width={candleWidth} height={volHeight - getVolY(d.volume)} fill={d.close >= d.open ? '#ef4444' : '#22c55e'} opacity="0.6"/>)}
            
            {/* 獨立開關的 VMA */}
            {toggles.showVolume && vmaParams.vma1.show !== false && <path d={getLinePath(data, 'vma1')} stroke={vmaParams.vma1.c} strokeWidth={vmaParams.vma1.w} fill="none" opacity="0.8"/>}
            {toggles.showVolume && vmaParams.vma2.show !== false && <path d={getLinePath(data, 'vma2')} stroke={vmaParams.vma2.c} strokeWidth={vmaParams.vma2.w} fill="none" opacity="0.8"/>}
            {toggles.showVolume && vmaParams.vma3.show !== false && <path d={getLinePath(data, 'vma3')} stroke={vmaParams.vma3.c} strokeWidth={vmaParams.vma3.w} fill="none" opacity="0.8"/>}

            {data.map((d, i) => {
              const x = padding + i * spacing + spacing / 2;
              return (
                <g key={`volsignal-${i}`}>
                  {toggles.showVolume && vmaParams.vma1.show !== false && i === data.length - vmaParams.vma1.p - 1 && <path d={`M ${x} ${volHeight+8} V ${volHeight+2} M ${x-2} ${volHeight+5} L ${x} ${volHeight+2} L ${x+2} ${volHeight+5}`} stroke={vmaParams.vma1.c} strokeWidth="2" fill="none" />}
                  {toggles.showVolume && vmaParams.vma2.show !== false && i === data.length - vmaParams.vma2.p - 1 && <path d={`M ${x} ${volHeight+8} V ${volHeight+2} M ${x-2} ${volHeight+5} L ${x} ${volHeight+2} L ${x+2} ${volHeight+5}`} stroke={vmaParams.vma2.c} strokeWidth="2" fill="none" />}
                  {toggles.showVolume && vmaParams.vma3.show !== false && i === data.length - vmaParams.vma3.p - 1 && <path d={`M ${x} ${volHeight+8} V ${volHeight+2} M ${x-2} ${volHeight+5} L ${x} ${volHeight+2} L ${x+2} ${volHeight+5}`} stroke={vmaParams.vma3.c} strokeWidth="2" fill="none" />}
                  {/* ✨ 補回：量能標記 */}
                  {toggles.showVolSignal && d.signalVol && <text x={x} y={getVolY(d.volume) - 5} fontSize="10" fontWeight="bold" textAnchor="middle" fill={d.signalVol === '天量' ? '#ef4444' : (d.signalVol === '巨量' ? '#f97316' : '#8b5cf6')}>{d.signalVol === '極限大量' ? '極' : d.signalVol[0]}</text>}
                </g>
              );
            })}
          </g>

          {/* 副圖區塊 */}
          <g transform={`translate(0, ${mainHeight + volHeight})`} clipPath="url(#chartClip)">
            {indicatorType !== 'None' && (<line x1={0} y1={0} x2={width} y2={0} stroke="#1e293b" strokeWidth="1" />)}
            
            {indicatorType === 'OBV' && (() => {
                let maxO = -Infinity, minO = Infinity; data.forEach(d => { if (d.obv > maxO) maxO = d.obv; if (d.obv < minO) minO = d.obv; if (d.obvMa !== null && d.obvMa > maxO) maxO = d.obvMa; if (d.obvMa !== null && d.obvMa < minO) minO = d.obvMa; });
                const range = (maxO - minO) || 1; const getObvY = (val) => indicatorHeight - ((val - minO) / range) * (indicatorHeight - indPadding*2) - indPadding;
                return (<g>
                    <path d={data.map((d, i) => `${i===0?'M':'L'} ${padding + i*spacing + spacing/2} ${getObvY(d.obv)}`).join(' ')} stroke="#eab308" strokeWidth="2" fill="none" />
                    <path d={data.map((d, i) => d.obvMa !== null ? `${i===0||data[i-1].obvMa===null?'M':'L'} ${padding + i*spacing + spacing/2} ${getObvY(d.obvMa)}` : '').join(' ')} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4,4" fill="none" />
                    <text x={padding} y={15} fill="#eab308" fontSize="10" fontWeight="bold">OBV</text>
                    <text x={padding + 40} y={15} fill="#38bdf8" fontSize="10" fontWeight="bold">MA({indicatorParams.obv?.ma || 20})</text>
                </g>);
            })()}

            {/* ✨ 寶塔線副圖 */}
            {indicatorType === 'TOWER' && (() => {
                let maxT = -Infinity, minT = Infinity; data.forEach(d => { if (d.tower.top > maxT) maxT = d.tower.top; if (d.tower.bottom < minT) minT = d.tower.bottom; });
                const range = (maxT - minT) || 1; const getTY = (val) => indicatorHeight - ((val - minT) / range) * (indicatorHeight - indPadding*2) - indPadding;
                return (<g>
                    {data.map((d, i) => <rect key={`tw-${i}`} x={padding + i * spacing + spacing / 2 - candleWidth/1.5} y={getTY(d.tower.top)} width={candleWidth*1.33} height={Math.max(1, getTY(d.tower.bottom) - getTY(d.tower.top))} fill={d.tower.color} opacity="0.85" />)}
                    <text x={padding} y={15} fill="#38bdf8" fontSize="10" fontWeight="bold">寶塔線 (獨立副圖)</text>
                </g>);
            })()}

            {/* 👇 第四步的程式碼貼在這裡 👇 */}
            {['外資', '投信', '自營', '投+外'].includes(indicatorType) && (() => {
                let maxV = -Infinity, minV = Infinity;
                data.forEach(d => {
                    let val = 0;
                    if (indicatorType === '外資') val = d.foreign || 0;
                    else if (indicatorType === '投信') val = d.trust || 0;
                    else if (indicatorType === '自營') val = d.dealer || 0;
                    else if (indicatorType === '投+外') val = (d.foreign || 0) + (d.trust || 0);

                    if (val > maxV) maxV = val;
                    if (val < minV) minV = val;
                });
                const absMax = Math.max(Math.abs(maxV), Math.abs(minV)) || 1;
                const getInstY = (val) => indicatorHeight / 2 - (val / absMax) * (indicatorHeight / 2 - indPadding);
                const zeroY = getInstY(0);

                return (
                    <g>
                        <line x1={0} y1={indicatorHeight / 2} x2={width} y2={indicatorHeight / 2} stroke="#1e293b" strokeDasharray="4,4" />
                        {data.map((d, i) => {
                            let val = 0;
                            if (indicatorType === '外資') val = d.foreign || 0;
                            else if (indicatorType === '投信') val = d.trust || 0;
                            else if (indicatorType === '自營') val = d.dealer || 0;
                            else if (indicatorType === '投+外') val = (d.foreign || 0) + (d.trust || 0);

                            const y = getInstY(val);
                            const color = val >= 0 ? '#ef4444' : '#22c55e'; // 紅買綠賣
                            return <rect key={`inst-${i}`} x={padding + i * spacing + spacing / 2 - candleWidth / 2} y={Math.min(y, zeroY)} width={candleWidth} height={Math.max(1, Math.abs(y - zeroY))} fill={color} opacity="0.8"/>;
                        })}
                        <text x={padding} y={15} fill="#f8fafc" fontSize="10" fontWeight="bold">
                            {indicatorType === '外資' ? '外資買賣超(張)' : indicatorType === '投信' ? '投信買賣超(張)' : indicatorType === '自營' ? '自營商買賣超(張)' : '投信+外資 合計買賣超(張)'}
                        </text>
                    </g>
                );
            })()}

            {indicatorType === '資券' && (() => {
                let maxM = -Infinity, minM = Infinity; 
                data.forEach(d => { 
                    if (d.marginDiff > maxM) maxM = d.marginDiff; if (d.marginDiff < minM) minM = d.marginDiff; 
                    if (d.shortDiff > maxM) maxM = d.shortDiff; if (d.shortDiff < minM) minM = d.shortDiff; 
                });
                const absMax = Math.max(Math.abs(maxM), Math.abs(minM)) || 1; 
                const getMarginY = (val) => indicatorHeight / 2 - (val / absMax) * (indicatorHeight / 2 - indPadding);
                return (<g>
                    <line x1={0} y1={indicatorHeight / 2} x2={width} y2={indicatorHeight / 2} stroke="#1e293b" strokeDasharray="4,4" />
                    {/* 用柱狀圖畫融資 */}
                    {data.map((d, i) => {
                        const y = getMarginY(d.marginDiff); const zeroY = getMarginY(0);
                        return <rect key={`margin-${i}`} x={padding + i * spacing + spacing / 2 - candleWidth / 2} y={Math.min(y, zeroY)} width={candleWidth} height={Math.max(1, Math.abs(y - zeroY))} fill={d.marginDiff >= 0 ? '#ef4444' : '#22c55e'} opacity="0.7"/>; 
                    })}
                    {/* 用線條畫融券 */}
                    <path d={data.map((d, i) => `${i===0?'M':'L'} ${padding + i*spacing + spacing/2} ${getMarginY(d.shortDiff)}`).join(' ')} stroke="#3b82f6" strokeWidth="1.5" fill="none" />
                    <text x={padding} y={15} fill="#ef4444" fontSize="10" fontWeight="bold">融資增減(柱)</text>
                    <text x={padding + 80} y={15} fill="#3b82f6" fontSize="10" fontWeight="bold">融券增減(線)</text>
                </g>);
            })()}
            
            {indicatorType === 'MACD' && (() => {
                    let maxM = -Infinity, minM = Infinity; data.forEach(d => { if (d.macd.dif > maxM) maxM = d.macd.dif; if (d.macd.dif < minM) minM = d.macd.dif; if (d.macd.macd > maxM) maxM = d.macd.macd; if (d.macd.macd < minM) minM = d.macd.macd; if (d.macd.osc > maxM) maxM = d.macd.osc; if (d.macd.osc < minM) minM = d.macd.osc; });
                    const absMax = Math.max(Math.abs(maxM), Math.abs(minM)) || 1; const getMyY = (val) => indicatorHeight / 2 - (val / absMax) * (indicatorHeight / 2 - indPadding);
                    return (<g>
                            <line x1={0} y1={indicatorHeight / 2} x2={width} y2={indicatorHeight / 2} stroke="#1e293b" strokeDasharray="4,4" />
                            {data.map((d, i) => { const y = getMyY(d.macd.osc); const zeroY = getMyY(0); return <rect key={`osc-${i}`} x={padding + i * spacing + spacing / 2 - candleWidth / 2} y={Math.min(y, zeroY)} width={candleWidth} height={Math.max(1, Math.abs(y - zeroY))} fill={d.macd.osc >= 0 ? '#ef4444' : '#22c55e'} opacity="0.6"/>; })}
                            <path d={data.map((d, i) => `${i===0?'M':'L'} ${padding + i*spacing + spacing/2} ${getMyY(d.macd.dif)}`).join(' ')} stroke="#38bdf8" strokeWidth="1.5" fill="none" />
                            <path d={data.map((d, i) => `${i===0?'M':'L'} ${padding + i*spacing + spacing/2} ${getMyY(d.macd.macd)}`).join(' ')} stroke="#f59e0b" strokeWidth="1.5" fill="none" />
                        </g>);
            })()}
            {indicatorType === 'KD' && (() => {
                    const getKdY = (val) => indicatorHeight - ((val) / 100) * (indicatorHeight - indPadding*2) - indPadding;
                    return (<g>
                            <line x1={0} y1={getKdY(80)} x2={width} y2={getKdY(80)} stroke="#1e293b" strokeDasharray="4,4" /><line x1={0} y1={getKdY(20)} x2={width} y2={getKdY(20)} stroke="#1e293b" strokeDasharray="4,4" />
                            <path d={data.map((d, i) => `${i===0?'M':'L'} ${padding + i*spacing + spacing/2} ${getKdY(d.kd.k)}`).join(' ')} stroke="#f59e0b" strokeWidth="1.5" fill="none" />
                            <path d={data.map((d, i) => `${i===0?'M':'L'} ${padding + i*spacing + spacing/2} ${getKdY(d.kd.d)}`).join(' ')} stroke="#38bdf8" strokeWidth="1.5" fill="none" />
                        </g>);
            })()}
            {indicatorType === 'RSI' && (() => {
                    const getRsiY = (val) => indicatorHeight - ((val) / 100) * (indicatorHeight - indPadding*2) - indPadding;
                    return (<g>
                            <line x1={0} y1={getRsiY(80)} x2={width} y2={getRsiY(80)} stroke="#1e293b" strokeDasharray="4,4" /><line x1={0} y1={getRsiY(50)} x2={width} y2={getRsiY(50)} stroke="#1e293b" strokeDasharray="4,4" /><line x1={0} y1={getRsiY(20)} x2={width} y2={getRsiY(20)} stroke="#1e293b" strokeDasharray="4,4" />
                            <path d={data.map((d, i) => d.rsi.rsi1 !== null ? `${i===0||data[i-1].rsi.rsi1===null?'M':'L'} ${padding + i*spacing + spacing/2} ${getRsiY(d.rsi.rsi1)}` : '').join(' ')} stroke="#ec4899" strokeWidth="1.5" fill="none" />
                            <path d={data.map((d, i) => d.rsi.rsi2 !== null ? `${i===0||data[i-1].rsi.rsi2===null?'M':'L'} ${padding + i*spacing + spacing/2} ${getRsiY(d.rsi.rsi2)}` : '').join(' ')} stroke="#38bdf8" strokeWidth="1.5" fill="none" />
                        </g>);
            })()}
          </g>

          <g clipPath="url(#chartClip)">
            {drawings.map(d => renderDrawingObject(d))}
            {activeTool !== 'cursor' && activeTool !== 'edit' && activeTool !== 'eraser' && draftPoints.length > 0 && hoverPoint &&
              renderDrawingObject({ type: activeTool, points: activeTool === 'crossline' ? [hoverPoint] : [...draftPoints, hoverPoint], color: drawColor, width: drawWidth, opacity: drawOpacity }, true)
            }
          </g>

          {/* ✨ 全新智慧查價線 (自動排版與縮放) */}
          {activeTool === 'cursor' && toggles.showCrosshair !== false && crosshair && data[crosshair.idx] && (() => {
            const hoverD = data[crosshair.idx];
            const tooltipLines = [];
            // ==========================================
            // 1. 基礎資訊（永遠顯示：開高低收量 + 3MA + 1VMA）
            // ==========================================
            tooltipLines.push({ color: '#94a3b8', text: hoverD?.date });
            tooltipLines.push({ color: '#e2e8f0', text: `開： ${hoverD?.open?.toFixed(2)}` });
            tooltipLines.push({ color: '#e2e8f0', text: `高： ${hoverD?.high?.toFixed(2)}` });
            tooltipLines.push({ color: '#e2e8f0', text: `低： ${hoverD?.low?.toFixed(2)}` });
            tooltipLines.push({ color: '#e2e8f0', text: `收： ${hoverD?.close?.toFixed(2)}` });
            tooltipLines.push({ color: '#e2e8f0', text: `量： ${hoverD?.volume} 張` });

            // 顯示 3 條主圖均線 MA
            if (toggles.showMA) {
                if (maParams.ma1.show !== false) tooltipLines.push({ color: maParams.ma1.c, text: `MA${maParams.ma1.p}： ${hoverD?.ma1?.toFixed(2) || '-'}` });
                if (maParams.ma2.show !== false) tooltipLines.push({ color: maParams.ma2.c, text: `MA${maParams.ma2.p}： ${hoverD?.ma2?.toFixed(2) || '-'}` });
                if (maParams.ma3.show !== false) tooltipLines.push({ color: maParams.ma3.c, text: `MA${maParams.ma3.p}： ${hoverD?.ma3?.toFixed(2) || '-'}` });
            }

            // 只顯示 1 條 VMA1 (預設5日均量線)
            if (toggles.showVolume && vmaParams.vma1.show !== false) {
                tooltipLines.push({ color: vmaParams.vma1.c, text: `VMA${vmaParams.vma1.p}： ${hoverD?.vma1?.toFixed(2) || '-'}` });
            }

            
            // ==========================================
            // 2. 進階進階資訊（必須勾選「查價詳細資訊」才顯示）
            // ==========================================
            if (toggles.showTooltipDetail) {
                if (toggles.showBBands) {
                    tooltipLines.push({ color: '#a855f7', text: `布林上： ${hoverD?.bbands?.up?.toFixed(2) || '-'}` });
                    tooltipLines.push({ color: '#d8b4fe', text: `布林中： ${hoverD?.bbands?.mid?.toFixed(2) || '-'}` });
                    tooltipLines.push({ color: '#a855f7', text: `布林下： ${hoverD?.bbands?.down?.toFixed(2) || '-'}` });
                }

                // ✨ 新增：高布林(3.0) 查價資訊
                if (toggles.showBBands3) {
                    tooltipLines.push({ color: '#f472b6', text: `高布林上： ${hoverD?.bbands?.up3?.toFixed(2) || '-'}` });
                    tooltipLines.push({ color: '#f472b6', text: `高布林下： ${hoverD?.bbands?.down3?.toFixed(2) || '-'}` });
                }

                // 補回 VMA2、VMA3 均量線
                if (toggles.showVolume) {
                    if (vmaParams.vma2.show !== false) tooltipLines.push({ color: vmaParams.vma2.c, text: `VMA${vmaParams.vma2.p}： ${hoverD?.vma2?.toFixed(2) || '-'}` });
                    if (vmaParams.vma3.show !== false) tooltipLines.push({ color: vmaParams.vma3.c, text: `VMA${vmaParams.vma3.p}： ${hoverD?.vma3?.toFixed(2) || '-'}` });
                }

                // 根據當前切換的副圖指標顯示對應數值
                if (indicatorType === 'MACD') {
                    tooltipLines.push({ color: "#38bdf8", text: `DIF： ${hoverD?.macd?.dif?.toFixed(2) || '-'}` });
                    tooltipLines.push({ color: "#f59e0b", text: `MACD： ${hoverD?.macd?.macd?.toFixed(2) || '-'}` });
                    tooltipLines.push({ color: hoverD?.macd?.osc >= 0 ? '#ef4444' : '#22c55e', text: `OSC： ${hoverD?.macd?.osc?.toFixed(2) || '-'}` });
                } else if (indicatorType === 'KD') {
                    tooltipLines.push({ color: "#f59e0b", text: `K(${indicatorParams.kd.k})： ${hoverD?.kd?.k?.toFixed(2) || '-'}` });
                    tooltipLines.push({ color: "#38bdf8", text: `D(${indicatorParams.kd.d})： ${hoverD?.kd?.d?.toFixed(2) || '-'}` });
                } else if (indicatorType === 'RSI') {
                    tooltipLines.push({ color: "#ec4899", text: `RSI(${indicatorParams.rsi.p1})： ${hoverD?.rsi?.rsi1?.toFixed(2) || '-'}` });
                    tooltipLines.push({ color: "#38bdf8", text: `RSI(${indicatorParams.rsi.p2})： ${hoverD?.rsi?.rsi2?.toFixed(2) || '-'}` });
                } else if (indicatorType === 'OBV') {
                    tooltipLines.push({ color: "#eab308", text: `OBV： ${hoverD?.obv}` });
                    tooltipLines.push({ color: "#38bdf8", text: `MA： ${hoverD?.obvMa?.toFixed(0) || '-'}` });
                } else if (indicatorType === 'TOWER') {
                    tooltipLines.push({ color: hoverD?.tower?.color, text: `寶塔頂： ${hoverD?.tower?.top?.toFixed(2)}` });
                    tooltipLines.push({ color: hoverD?.tower?.color, text: `寶塔底： ${hoverD?.tower?.bottom?.toFixed(2)}` });
                } else if (['外資', '投信', '自營', '投+外'].includes(indicatorType)) {
                    if (indicatorType === '外資') tooltipLines.push({ color: "#f472b6", text: `外資： ${hoverD?.foreign?.toFixed(0) || 0} 張` });
                    if (indicatorType === '投信') tooltipLines.push({ color: "#34d399", text: `投信： ${hoverD?.trust?.toFixed(0) || 0} 張` });
                    if (indicatorType === '自營') tooltipLines.push({ color: "#fbbf24", text: `自營： ${hoverD?.dealer?.toFixed(0) || 0} 張` });
                    if (indicatorType === '投+外') {
                        tooltipLines.push({ color: "#f472b6", text: `外資： ${hoverD?.foreign?.toFixed(0) || 0} 張` });
                        tooltipLines.push({ color: "#34d399", text: `投信： ${hoverD?.trust?.toFixed(0) || 0} 張` });
                        tooltipLines.push({ color: "#38bdf8", text: `合買： ${((hoverD?.foreign || 0) + (hoverD?.trust || 0)).toFixed(0)} 張` });
                    }
                } else if (indicatorType === '資券') {
                    tooltipLines.push({ color: "#ef4444", text: `融資增減： ${hoverD?.marginDiff?.toFixed(0) || 0} 張` });
                    tooltipLines.push({ color: "#3b82f6", text: `融券增減： ${hoverD?.shortDiff?.toFixed(0) || 0} 張` });
                }

            }

            const boxWidth = 140; 
            const boxHeight = tooltipLines.length * 22 + 10;
            
            let tooltipX = crosshair.x + 15; let tooltipY = crosshair.y - boxHeight / 2;
            if (tooltipX + boxWidth > width) tooltipX = crosshair.x - boxWidth - 15;
            if (tooltipY < 0) tooltipY = 5; if (tooltipY + boxHeight > mainHeight + volHeight + indicatorHeight) tooltipY = mainHeight + volHeight + indicatorHeight - boxHeight - 5;

            return (
              <g className="pointer-events-none">
                <line x1={crosshair.x} y1={padding} x2={crosshair.x} y2={mainHeight + volHeight + indicatorHeight} stroke="#38bdf8" strokeDasharray="4,4" strokeWidth="1.2" />
                {crosshair.priceHover !== null && (
                  <g>
                    <line x1={0} y1={crosshair.y} x2={width} y2={crosshair.y} stroke="#38bdf8" strokeDasharray="4,4" strokeWidth="1.2" />
                    <rect x={width - 55} y={crosshair.y - 12} width={55} height={24} fill="#0ea5e9" rx="4" />
                    <text x={width - 27} y={crosshair.y + 4} fill="#0f172a" fontSize="13" fontWeight="bold" textAnchor="middle">{crosshair.priceHover.toFixed(2)}</text>
                  </g>
                )}
                <g transform={`translate(${tooltipX}, ${tooltipY})`} opacity="0.6">
                  <rect x={0} y={0} width={boxWidth} height={boxHeight} fill="rgba(15, 23, 42, 0.30)" stroke="#0ea5e9" rx="8" />
                  {tooltipLines.map((l, i) => (
                      <text key={i} x={12} y={22 + i * 22} fontSize="13" fill={l.color} fontWeight="bold" opacity="0.4">{l.text}</text>
                  ))}
                </g>
              </g>
            );
          })()}
          {/* ✨ 補回：圖表底部圖例 (Legend) */}
          <g transform={`translate(${width / 2}, ${mainHeight + volHeight + indicatorHeight + 60})`} textAnchor="middle" fontSize="14" fill="#94a3b8">
            {toggles.showTrend && <text x="-240"><tspan fill="#10b981" fontWeight="bold">🔺</tspan> 起漲</text>}
            {toggles.showVolSignal && <text x="-160"><tspan fill="#ef4444" fontWeight="bold">天</tspan> 天量</text>}
            {toggles.showVolSignal && <text x="-80"><tspan fill="#f97316" fontWeight="bold">巨</tspan> 巨量</text>}
            {toggles.showVolSignal && <text x="0"><tspan fill="#8b5cf6" fontWeight="bold">極</tspan> 極限量</text>}
            {toggles.showHeidun && <text x="80"><tspan fill="#f8fafc" fontWeight="bold">黑頓</tspan></text>}
            {customStrategies.filter(s => s.isActive).map((strat, idx) => <text key={strat.id} x={180 + (idx * 100)}><tspan fill="#4f46e5" fontWeight="bold">{strat.marker}</tspan> {strat.name}</text>)}
          </g>
          
        </svg>
      </div>
    </div>
  );
};

const generateMockData = () => {
  let price = 500;
  const today = new Date();
  return Array.from({length: 180}).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (180 - i));
    const open = price + (Math.random()-0.5)*10, close = open + (Math.random()-0.5)*20;
    const high = Math.max(open, close) + Math.random()*5, low = Math.min(open, close) - Math.random()*5; price = close;
    return { date: d.toISOString().split('T')[0], open, high, low, close, volume: Math.floor(Math.random() * 5000) + 1000 };
  });
};

export default App;
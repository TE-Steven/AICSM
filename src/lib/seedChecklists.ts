/**
 * 健檢項目種子資料（三層：構面 → 類別 → 檢核點，含權重與建議 Action）。
 *
 * - 「通用」構面（isUniversal）放進內建的「通用」行業，所有公司自動繼承。
 * - 其餘構面依 industryNames 放進對應行業。
 * 由 seedAicsm.ts 的冪等種子流程使用：只補缺的項目，不覆蓋後台已經改過的內容。
 */

export interface LeafSpec {
  name: string;
  defaultWeight: number;
  defaultAction: string;
}

export interface CategorySpec {
  name: string;
  description?: string;
  leaves: LeafSpec[];
}

export interface RootSpec {
  name: string;
  description: string;
  isUniversal: boolean;
  industryNames?: string[];
  categories: CategorySpec[];
}

export const CHECKLIST_FRAMEWORK: RootSpec[] = [
  {
    name: "服務流程健康度",
    description: "檢視售前、售中、售後到回購推薦，客服流程是否完整無斷點。",
    isUniversal: true,
    categories: [
      {
        name: "售前",
        leaves: [
          {
            name: "售前諮詢自動應答涵蓋率",
            defaultWeight: 2,
            defaultAction: "建立售前常見問題自動應答流程，導入前導客服機器人，確保未上班時段也有基本回覆。",
          },
          {
            name: "商品／服務資訊揭露完整度",
            defaultWeight: 1,
            defaultAction: "補齊商品規格、價格與退換貨政策頁面，避免顧客因資訊不足而重複詢問客服。",
          },
          {
            name: "潛客留資與名單捕捉機制",
            defaultWeight: 1,
            defaultAction: "建立售前留資表單並串接 CRM，避免潛在客戶詢問後石沉大海。",
          },
        ],
      },
      {
        name: "售中",
        leaves: [
          {
            name: "訂單／交易異常即時介入機制",
            defaultWeight: 2,
            defaultAction: "建立訂單異常自動告警並轉真人客服 SOP，縮短顧客等待說明時間。",
          },
          {
            name: "首次回應時間（First Response Time）",
            defaultWeight: 3,
            defaultAction: "設定回應時效 SLA 並建立監控報表，超標時自動提醒主管介入。",
          },
          {
            name: "跨渠道對話紀錄同步",
            defaultWeight: 1,
            defaultAction: "導入工單系統整合各渠道對話紀錄，避免顧客換渠道詢問要重講一次。",
          },
        ],
      },
      {
        name: "售後",
        leaves: [
          {
            name: "退換貨／客訴處理 SOP",
            defaultWeight: 2,
            defaultAction: "制定標準客訴／退換貨處理流程並教育客服人員，確保各案件處理一致。",
          },
          {
            name: "客訴升級機制（Escalation）",
            defaultWeight: 2,
            defaultAction: "建立客訴分級與主管介入機制，重大客訴不能卡在第一線超過時限。",
          },
          {
            name: "售後滿意度追蹤",
            defaultWeight: 1,
            defaultAction: "結案後自動發送售後滿意度調查，掌握顧客實際感受而非只看內部結案率。",
          },
        ],
      },
      {
        name: "推薦與回購",
        leaves: [
          {
            name: "VIP／老客戶專屬客服通路",
            defaultWeight: 1,
            defaultAction: "建立 VIP 專屬窗口或優先排隊機制，提升高價值客戶的服務體驗。",
          },
          {
            name: "結案轉推薦／回購訊息機制",
            defaultWeight: 1,
            defaultAction: "於客服結案模板中加入推薦優惠訊息，把每次服務接觸轉化為回購機會。",
          },
          {
            name: "客戶沉寂預警機制",
            defaultWeight: 2,
            defaultAction: "建立客戶久未互動天數告警，主動關懷避免流失於無形。",
          },
        ],
      },
    ],
  },
  {
    name: "渠道完整度與健康度",
    description: "官網、LINE、Facebook、Instagram、電話等各客服渠道是否齊全且連線正常。",
    isUniversal: true,
    categories: [
      {
        name: "官方網站",
        leaves: [
          {
            name: "線上客服／Chatbot 建置狀態",
            defaultWeight: 2,
            defaultAction: "建置官網線上客服工具並串接客服後台，減少顧客找不到聯絡窗口而放棄。",
          },
          {
            name: "網頁客服回應時效",
            defaultWeight: 1,
            defaultAction: "檢視排班與自動回覆設定，確保尖峰時段仍有人力涵蓋。",
          },
        ],
      },
      {
        name: "LINE官方帳號",
        leaves: [
          {
            name: "官方帳號客服功能啟用狀態",
            defaultWeight: 3,
            defaultAction: "申請並開通 LINE 官方帳號客服對話功能，這是多數顧客最先嘗試的渠道。",
          },
          {
            name: "圖文選單／自動回覆完整度",
            defaultWeight: 1,
            defaultAction: "建置圖文選單與常見問題自動回覆，降低重複性問題佔用真人客服時間。",
          },
          {
            name: "好友數與互動率健康度",
            defaultWeight: 1,
            defaultAction: "檢討好友增長策略與推播內容，避免帳號變成沉默通路。",
          },
        ],
      },
      {
        name: "Facebook",
        leaves: [
          {
            name: "Messenger 客服啟用狀態",
            defaultWeight: 2,
            defaultAction: "開通並串接 Facebook Messenger 客服，避免粉專留言區成為唯一（且效率低落的）聯絡方式。",
          },
          {
            name: "粉專回覆時效",
            defaultWeight: 1,
            defaultAction: "調整值班排程以維持快速回覆徽章，回覆過慢會直接影響粉專公開形象。",
          },
        ],
      },
      {
        name: "Instagram",
        leaves: [
          {
            name: "IG 私訊串接客服系統",
            defaultWeight: 1,
            defaultAction: "串接 IG 私訊到客服系統統一管理，避免遺漏私訊被視為已讀不回。",
          },
          {
            name: "留言／私訊未回覆積壓監控",
            defaultWeight: 1,
            defaultAction: "建立未讀提醒與定期清查機制，尤其在行銷活動期間留言量暴增時。",
          },
        ],
      },
      {
        name: "電話客服",
        leaves: [
          {
            name: "客服專線與 IVR 建置狀態",
            defaultWeight: 1,
            defaultAction: "建置客服專線及來電語音導覽，讓緊急／不擅長打字的顧客有替代管道。",
          },
          {
            name: "接通率與等候時間健康度",
            defaultWeight: 2,
            defaultAction: "檢討客服人力排班改善接通率，長時間等候是客訴與差評的常見主因。",
          },
        ],
      },
    ],
  },
  {
    name: "顧客滿意度",
    description: "顧客對客服互動的主觀評價、申訴狀況與推薦意願。",
    isUniversal: true,
    categories: [
      {
        name: "滿意度調查機制",
        leaves: [
          {
            name: "調查是否已上線發送",
            defaultWeight: 2,
            defaultAction: "於客服結案流程加入滿意度調查發送，沒有調查就沒有客觀的滿意度數據。",
          },
          {
            name: "問卷回收率健康度",
            defaultWeight: 1,
            defaultAction: "優化發送時機與題數（結案當下即時發送、題目精簡），提升填答意願。",
          },
          {
            name: "低分案件複盤機制",
            defaultWeight: 2,
            defaultAction: "建立低分案件自動轉單複盤 SOP，避免同類問題重複發生卻沒人追蹤根因。",
          },
        ],
      },
      {
        name: "客訴與負評管理",
        leaves: [
          {
            name: "外部負評監測機制",
            defaultWeight: 2,
            defaultAction: "建置 Google 評論／社群留言監測告警並指派專人回覆，負評沒人發現就等於放任擴散。",
          },
          {
            name: "客訴回覆時效",
            defaultWeight: 2,
            defaultAction: "訂定客訴 24 小時內回覆 SLA，拖延回覆本身就是二次傷害。",
          },
        ],
      },
      {
        name: "NPS與推薦意願",
        leaves: [
          {
            name: "NPS 定期調查機制",
            defaultWeight: 1,
            defaultAction: "導入定期 NPS 調查追蹤顧客推薦意願，作為顧客關係健康度的領先指標。",
          },
        ],
      },
    ],
  },
  {
    name: "系統使用度與黏著度",
    description: "客服系統與智能客服的實際使用狀況，對應「使用量」流失指標。",
    isUniversal: true,
    categories: [
      {
        name: "客服系統活躍度",
        leaves: [
          {
            name: "客服人員登入／使用頻率",
            defaultWeight: 1,
            defaultAction: "檢視使用狀況並加強教育訓練，避免系統形同虛設、實際仍靠土法煉鋼。",
          },
          {
            name: "工單／知識庫等模組使用覆蓋率",
            defaultWeight: 1,
            defaultAction: "針對未使用的模組安排導入教學，功能沒用到就等於白付費。",
          },
        ],
      },
      {
        name: "智能客服使用率",
        leaves: [
          {
            name: "智能客服導流比例",
            defaultWeight: 2,
            defaultAction: "檢討導流設定提升自動化比例，人力應該留給真正需要真人判斷的案件。",
          },
          {
            name: "知識庫內容更新頻率",
            defaultWeight: 1,
            defaultAction: "建立知識庫定期盤點更新機制，過時內容比沒有內容更危險。",
          },
        ],
      },
    ],
  },
  {
    name: "問題解決效能",
    description: "客服團隊實際解決問題的能力，對應「解決率」流失指標。",
    isUniversal: true,
    categories: [
      {
        name: "解決率",
        leaves: [
          {
            name: "首次接觸解決率（FCR）",
            defaultWeight: 3,
            defaultAction: "分析未解決案件原因並補強教育訓練／知識庫，FCR 偏低通常是體驗殺手第一名。",
          },
          {
            name: "智能客服識別率／解決率",
            defaultWeight: 1,
            defaultAction: "優化語意訓練與常見問題涵蓋度，避免顧客被機器人反覆打轉後才轉真人。",
          },
        ],
      },
      {
        name: "工單管理",
        leaves: [
          {
            name: "逾期未結案工單積壓",
            defaultWeight: 2,
            defaultAction: "建立逾期工單告警並定期清查，積壓工單是流失風險的隱藏地雷。",
          },
          {
            name: "問題分類與根因分析機制",
            defaultWeight: 1,
            defaultAction: "建立問題分類統計報表找出高頻問題並優化流程，而不是只救火不處理根因。",
          },
        ],
      },
    ],
  },
  {
    name: "導入與教育訓練",
    description: "客服人員上手程度、系統導入完整度與知識庫維護狀況。",
    isUniversal: true,
    categories: [
      {
        name: "系統導入完整度",
        leaves: [
          {
            name: "初始設定完成度",
            defaultWeight: 1,
            defaultAction: "安排導入顧問協助完成未設定項目，導入沒做完，後面所有指標都會失真。",
          },
          {
            name: "資料與歷史紀錄遷移完整度",
            defaultWeight: 1,
            defaultAction: "確認舊系統歷史客戶資料已完整匯入，避免客服人員接手時資訊斷層。",
          },
        ],
      },
      {
        name: "教育訓練",
        leaves: [
          {
            name: "客服人員教育訓練完成率",
            defaultWeight: 1,
            defaultAction: "排定定期教育訓練並建立教材，直接影響使用率與處理效率。",
          },
          {
            name: "新進人員上手流程",
            defaultWeight: 1,
            defaultAction: "建立標準化新人上手 SOP 與 buddy 制度，避免新人靠自己摸索拖慢團隊平均表現。",
          },
        ],
      },
    ],
  },
  {
    name: "帳務與續約健康度",
    description: "合約、用量與付款狀態，客戶成功團隊的追蹤重點。",
    isUniversal: true,
    categories: [
      {
        name: "帳務狀況",
        leaves: [
          {
            name: "帳款繳納狀態",
            defaultWeight: 2,
            defaultAction: "通知財務／業務窗口確認繳款狀況，逾期未繳是流失前最明確的早期訊號之一。",
          },
          {
            name: "用量與方案匹配度",
            defaultWeight: 1,
            defaultAction: "評估方案調整建議並主動聯繫客戶，超用或低用都值得主動溝通。",
          },
        ],
      },
      {
        name: "續約風險",
        leaves: [
          {
            name: "合約到期日健康度",
            defaultWeight: 2,
            defaultAction: "提前 90 天啟動續約溝通，避免臨到期才發現客戶已在評估其他方案。",
          },
          {
            name: "客戶成功關係健康度",
            defaultWeight: 1,
            defaultAction: "確認客戶成功團隊是否有定期業務回顧會議（QBR），長期沒有互動的客戶續約風險最高。",
          },
        ],
      },
    ],
  },
  {
    name: "零售通路客服",
    description: "零售業特有的訂單、到店與會員相關客服場景。",
    isUniversal: false,
    industryNames: ["零售"],
    categories: [
      {
        name: "訂單與到店服務",
        leaves: [
          {
            name: "訂單查詢回覆時效",
            defaultWeight: 2,
            defaultAction: "檢查是否有串接物流查詢 API 自動化回覆，減少人工查詢時間。",
          },
          {
            name: "到店服務與門市客服協作",
            defaultWeight: 1,
            defaultAction: "建立線上客服與門市之間的顧客資訊同步機制，避免顧客到店還要重講一次線上已反映的問題。",
          },
        ],
      },
      {
        name: "退換貨與商品客訴",
        leaves: [
          {
            name: "退換貨處理效率",
            defaultWeight: 2,
            defaultAction: "檢視退換貨 SOP 與跨部門（倉儲、金流）溝通流程是否有延遲環節。",
          },
          {
            name: "商品品質／出貨異常客訴處理",
            defaultWeight: 2,
            defaultAction: "與倉儲物流單位建立異常即時通報機制，縮短顧客等待說明的時間。",
          },
        ],
      },
      {
        name: "會員與行銷客服",
        leaves: [
          {
            name: "會員點數／優惠券客訴處理",
            defaultWeight: 1,
            defaultAction: "確認會員系統與客服後台資料同步即時性，避免點數／優惠爭議查證耗時過長。",
          },
          {
            name: "行銷活動期間客服量能",
            defaultWeight: 2,
            defaultAction: "大型促銷檔期前提前評估客服排班與自動回覆分流，避免活動當下大量客訴湧入無法消化。",
          },
        ],
      },
    ],
  },
  {
    name: "餐飲服務客服",
    description: "餐飲業特有的訂位、外送與餐點品質相關客服場景。",
    isUniversal: false,
    industryNames: ["餐飲連鎖"],
    categories: [
      {
        name: "訂位與現場服務",
        leaves: [
          {
            name: "訂位系統與客服協調",
            defaultWeight: 1,
            defaultAction: "確認訂位系統異常（客滿誤判、雙重訂位）能即時反映給客服處理，避免顧客到店撲空。",
          },
          {
            name: "現場服務客訴通報時效",
            defaultWeight: 2,
            defaultAction: "建立門市與總部客服即時通報機制，現場服務糾紛須第一時間有人接手安撫。",
          },
        ],
      },
      {
        name: "外送與外帶協調",
        leaves: [
          {
            name: "外送平台異常即時通報時效",
            defaultWeight: 2,
            defaultAction: "檢視是否有與外送平台即時串接異常告警（餐點遺失、延誤），縮短顧客等待說明時間。",
          },
          {
            name: "訂單取消／退款處理速度",
            defaultWeight: 2,
            defaultAction: "確認金流退款流程是否需要人工審核，評估是否可自動化縮短處理時間。",
          },
        ],
      },
      {
        name: "餐點品質客訴",
        leaves: [
          {
            name: "餐點品質客訴處理 SOP",
            defaultWeight: 2,
            defaultAction: "制定標準化餐點品質客訴處理與補償原則，避免各分店標準不一造成顧客觀感落差。",
          },
          {
            name: "尖峰時段客服量能",
            defaultWeight: 1,
            defaultAction: "評估用餐尖峰時段排班調整或啟用自動回覆分流機制。",
          },
        ],
      },
    ],
  },
  {
    name: "數位平台客服",
    description: "數位平台業特有的帳號、金流與系統效能相關客服場景。",
    isUniversal: false,
    industryNames: ["數位平台"],
    categories: [
      {
        name: "帳號與存取問題",
        leaves: [
          {
            name: "帳號登入／權限異常客訴",
            defaultWeight: 2,
            defaultAction: "檢視登入失敗率與常見錯誤代碼，建立自助排除指引降低客服負擔。",
          },
          {
            name: "帳號被盜／資安疑慮通報處理",
            defaultWeight: 3,
            defaultAction: "建立資安事件優先處理通道，這類案件延遲處理風險最高、須列為最高優先。",
          },
        ],
      },
      {
        name: "金流與訂閱異常",
        leaves: [
          {
            name: "訂閱扣款異常客訴",
            defaultWeight: 2,
            defaultAction: "確認金流商扣款失敗通知機制是否即時同步給客服，避免顧客誤以為服務中斷。",
          },
          {
            name: "退費／取消訂閱流程順暢度",
            defaultWeight: 1,
            defaultAction: "檢視退費流程是否過度複雜導致客訴，複雜的退費流程本身就是負評來源。",
          },
        ],
      },
      {
        name: "平台效能與內容問題",
        leaves: [
          {
            name: "App／網站當機或效能異常通報",
            defaultWeight: 2,
            defaultAction: "建立系統監控與客服端即時告警串接，效能異常應主動通知使用者而非等客訴湧入。",
          },
          {
            name: "內容／課程存取異常處理",
            defaultWeight: 1,
            defaultAction: "確認內容存取異常（如影片無法播放、教材下載失敗）有明確的客服排除 SOP。",
          },
        ],
      },
    ],
  },
  {
    name: "家電售後與使用服務",
    description: "消費家電業特有的保固維修、使用諮詢與配件耗材客服場景。",
    isUniversal: false,
    industryNames: ["消費家電"],
    categories: [
      {
        name: "保固維修與到府服務",
        leaves: [
          {
            name: "報修受理與派工時效",
            defaultWeight: 3,
            defaultAction: "建立報修單自動派工與進度通知流程，讓顧客不用重複來電追問維修進度。",
          },
          {
            name: "保固資格查詢自動化",
            defaultWeight: 2,
            defaultAction: "串接產品序號／購買紀錄，讓機器人可自助查詢保固狀態，減少人工核對。",
          },
          {
            name: "到府服務預約與準時率",
            defaultWeight: 1,
            defaultAction: "提供線上預約時段與到府前提醒，並追蹤準時率，爽約與延誤是客訴主因之一。",
          },
        ],
      },
      {
        name: "產品使用與故障排除諮詢",
        leaves: [
          {
            name: "常見故障排除知識庫涵蓋率",
            defaultWeight: 3,
            defaultAction: "依客服高頻問題補齊故障排除圖文／影片教學，並讓智能客服可直接引用。",
          },
          {
            name: "新品上市客服準備度",
            defaultWeight: 2,
            defaultAction: "新品發表前提前建好 FAQ 與話術，避免上市初期詢問量暴增卻答不出來。",
          },
        ],
      },
      {
        name: "配件耗材與電商訂單客服",
        leaves: [
          {
            name: "配件耗材購買與相容性諮詢",
            defaultWeight: 1,
            defaultAction: "建立機型與配件相容對照表，供客服與機器人快速查詢，避免誤購退貨。",
          },
          {
            name: "電商訂單與物流異常處理",
            defaultWeight: 2,
            defaultAction: "與電商平台訂單／物流資料串接，異常訂單主動通知並提供處理方案。",
          },
        ],
      },
    ],
  },
  {
    name: "美業預約與會員服務",
    description: "美業特有的預約、療程諮詢與會員儲值客服場景。",
    isUniversal: false,
    industryNames: ["美業"],
    categories: [
      {
        name: "預約與到店服務",
        leaves: [
          {
            name: "線上預約與改期流程順暢度",
            defaultWeight: 3,
            defaultAction: "提供 LINE／官網自助預約、改期與取消，並自動發送預約前提醒，降低爽約率。",
          },
          {
            name: "預約衝突與候補處理",
            defaultWeight: 1,
            defaultAction: "建立熱門時段候補名單與釋出通知，避免客人被拒後直接流失。",
          },
        ],
      },
      {
        name: "療程與產品諮詢客訴",
        leaves: [
          {
            name: "療程內容與價格諮詢回覆品質",
            defaultWeight: 2,
            defaultAction: "整理療程介紹、價格與適用對象的標準答覆，確保各門市說法一致。",
          },
          {
            name: "術後照護與客訴處理 SOP",
            defaultWeight: 3,
            defaultAction: "建立術後照護提醒與不適／客訴分級處理流程，高風險案件須立即轉專人。",
          },
        ],
      },
      {
        name: "會員儲值與療程券",
        leaves: [
          {
            name: "儲值金／療程券餘額查詢",
            defaultWeight: 2,
            defaultAction: "讓會員可自助查詢儲值餘額與療程券效期，並於到期前主動提醒。",
          },
          {
            name: "會員權益客訴處理",
            defaultWeight: 1,
            defaultAction: "明訂轉讓、退款與效期爭議的處理原則，客服依標準答覆避免私下承諾。",
          },
        ],
      },
    ],
  },
  {
    name: "旅宿服務客服",
    description: "旅宿業特有的訂房、住宿期間與評價營運相關客服場景。",
    isUniversal: false,
    industryNames: ["旅宿服務"],
    categories: [
      {
        name: "訂房與入住退房",
        leaves: [
          {
            name: "訂房諮詢與房況／房價回覆時效",
            defaultWeight: 2,
            defaultAction: "整合官網、LINE 與 OTA 的房況與房價資料，讓機器人可即時回覆空房與價格，減少錯失訂房機會。",
          },
          {
            name: "訂單異動與取消退款處理",
            defaultWeight: 2,
            defaultAction: "建立訂單改期、取消與退款的標準流程與自動通知，避免人工查證耗時與政策說法不一。",
          },
          {
            name: "入住退房流程與櫃檯協作",
            defaultWeight: 1,
            defaultAction: "建立線上客服與櫃檯的即時資訊同步（提早入住、延遲退房、行李寄放），避免住客到店還要重複說明。",
          },
        ],
      },
      {
        name: "住宿期間服務",
        leaves: [
          {
            name: "客房需求與設施報修回應時效",
            defaultWeight: 3,
            defaultAction: "建立客房需求（備品、清潔、報修）工單與派工通知並設定回應時效，住宿期間的延遲最容易變成負評。",
          },
          {
            name: "住客客訴即時通報與升級",
            defaultWeight: 2,
            defaultAction: "建立夜間與假日的客訴通報與主管升級機制，嚴重事件須即時處理並留存紀錄。",
          },
          {
            name: "旅遊與周邊資訊諮詢知識庫",
            defaultWeight: 1,
            defaultAction: "整理周邊交通、景點與餐飲資訊供機器人回覆，減少櫃檯重複回答。",
          },
        ],
      },
      {
        name: "評價與旺季營運",
        leaves: [
          {
            name: "旺季／連假客服量能",
            defaultWeight: 2,
            defaultAction: "連假與旺季前評估排班與自動回覆分流，避免訂房與詢問量暴增時無法消化。",
          },
          {
            name: "OTA／Google 評論監測與回覆",
            defaultWeight: 2,
            defaultAction: "建立 OTA 與 Google 評論監測告警並指派專人回覆，負評回覆時效直接影響訂房轉換。",
          },
        ],
      },
    ],
  },
];

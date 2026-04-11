import { mapPositions } from "../lib/api.js";

export const tripMeta = {
  title: "대전여행",
  subtitle: "8명이 함께 고르는 대전 스팟",
  description:
    "맛집부터 산책 코스까지, 친구들이 저장한 장소를 예쁜 카드로 모아보고 바로 추가할 수 있는 여행 위시리스트 보드",
  range: "5월 17일 - 5월 18일",
  memberCount: 8,
  city: "Daejeon"
};

export const seedPlaces = [
  {
    id: "sungsimdang",
    name: "성심당 본점",
    category: "cafe",
    reason: "대전 오면 무조건 들러야 하는 빵 성지라서 첫 스타트로 완벽해요.",
    description:
      "튀김소보로 하나만으로도 여행 텐션이 올라가는 대표 스팟. 빵 쇼핑 후 근처 골목을 천천히 걷기에도 좋아요.",
    address: "대전 중구 대종로480번길 15",
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
    friendName: "지원",
    friendNote: "아침에 여기서 빵 한가득 사서 숙소 가면 여행 시작 느낌 제대로 날 듯!",
    saveCount: 6,
    baseSaveCount: 6,
    saved: false,
    createdLabel: "지원이 2시간 전 저장",
    mapPosition: mapPositions[0],
    tags: ["빵지순례", "오픈런"]
  },
  {
    id: "oc-kalguksu",
    name: "오씨칼국수",
    category: "restaurant",
    reason: "해물칼국수랑 파전 조합이 든든해서 첫 끼나 해장 코스로 좋을 것 같아요.",
    description:
      "진한 국물과 바삭한 파전이 유명한 대전 로컬 맛집. 웨이팅이 있어도 한 번은 가볼 만하다는 추천이 많은 곳이에요.",
    address: "대전 동구 옛신탄진로 13",
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
    friendName: "민호",
    friendNote: "우리 아침 느긋하게 시작하면 여기서 칼국수 먹고 이동하면 딱일 듯.",
    saveCount: 4,
    baseSaveCount: 4,
    saved: true,
    createdLabel: "민호가 어제 저장",
    mapPosition: mapPositions[1],
    tags: ["로컬맛집", "든든한한끼"]
  },
  {
    id: "hanbat-arboretum",
    name: "한밭수목원",
    category: "walk",
    reason: "중간에 쉬어가기 좋고, 초록 뷰 사진이 잘 나와서 산책 코스로 딱이에요.",
    description:
      "도심 한가운데에서 넓게 숨 돌릴 수 있는 수목원. 카페와 쇼핑 코스 사이에 넣으면 일정이 훨씬 부드러워져요.",
    address: "대전 서구 둔산대로 169",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    friendName: "유진",
    friendNote: "여기서 노을 지는 시간 맞추면 단체사진 진짜 예쁠 것 같아.",
    saveCount: 5,
    baseSaveCount: 5,
    saved: false,
    createdLabel: "유진이 오늘 저장",
    mapPosition: mapPositions[2],
    tags: ["산책", "사진맛집"]
  },
  {
    id: "shinsegae-art-science",
    name: "대전신세계 Art & Science",
    category: "tour",
    reason: "쇼핑도 하고 전망대 느낌으로 둘러보기 좋아서 비 오는 날 대안으로도 좋아요.",
    description:
      "백화점 이상의 복합 스팟. 실내 이동이 편해서 날씨 변수에 강하고, 사진 찍을 포인트도 많아요.",
    address: "대전 유성구 엑스포로 1",
    imageUrl:
      "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=900&q=80",
    friendName: "소희",
    friendNote: "실내 코스 하나는 꼭 있어야 해서 저장해뒀어. 쇼핑파 만족도 높을 듯!",
    saveCount: 3,
    baseSaveCount: 3,
    saved: false,
    createdLabel: "소희가 어제 저장",
    mapPosition: mapPositions[3],
    tags: ["실내코스", "복합문화"]
  },
  {
    id: "soje-dong",
    name: "소제동 카페 거리",
    category: "cafe",
    reason: "감성적인 골목 분위기 덕분에 카페 투어랑 사진 찍기에 제일 잘 어울려요.",
    description:
      "오래된 건물과 세련된 카페가 섞여 있어서 대전 특유의 분위기를 느끼기 좋은 동네. 가볍게 걷다가 취향 따라 들어가기 좋아요.",
    address: "대전 동구 소제동 일대",
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
    friendName: "도현",
    friendNote: "카페 하나 정해놓기보다 여기서 골라 들어가는 재미가 있을 것 같아.",
    saveCount: 7,
    baseSaveCount: 7,
    saved: true,
    createdLabel: "도현이 30분 전 저장",
    mapPosition: mapPositions[4],
    tags: ["감성골목", "카페투어"]
  },
  {
    id: "dadong-sky-park",
    name: "대동하늘공원",
    category: "tour",
    reason: "야경이 예뻐서 하루 마무리 장소로 분위기 있게 딱 좋을 것 같아요.",
    description:
      "대전 시내를 한눈에 내려다볼 수 있는 전망 스팟. 저녁에 올라가면 사진도 예쁘고, 여행 마지막 대화 장소로도 잘 어울려요.",
    address: "대전 동구 자양동 산14-1",
    imageUrl:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80",
    friendName: "하은",
    friendNote: "첫날 밤에 여기 가면 여행 기억이 되게 오래 남을 것 같아.",
    saveCount: 5,
    baseSaveCount: 5,
    saved: false,
    createdLabel: "하은이 어젯밤 저장",
    mapPosition: mapPositions[5],
    tags: ["야경", "마무리코스"]
  },
  {
    id: "daeheung-winebar",
    name: "대흥동 와인바 골목",
    category: "pub",
    reason: "둘째 날 밤에 한잔하면서 여행 얘기 정리하기 좋은 분위기라 저장했어요.",
    description:
      "너무 시끄럽지 않고 대화하기 좋은 바들이 모여 있는 동네. 일정 끝나고 가볍게 모여 수다 떨기 좋아요.",
    address: "대전 중구 대흥동 일대",
    imageUrl:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80",
    friendName: "지수",
    friendNote: "숙소 들어가기 전에 한 군데만 골라서 가도 재미있을 것 같아.",
    saveCount: 2,
    baseSaveCount: 2,
    saved: false,
    createdLabel: "지수가 방금 저장",
    mapPosition: mapPositions[6],
    tags: ["술집", "2차후보"]
  },
  {
    id: "temi-orae",
    name: "테미오래",
    category: "etc",
    reason: "한적하게 둘러보면서 대전의 분위기를 천천히 느끼기 좋을 것 같아요.",
    description:
      "근대 건축물을 리뉴얼한 공간이라 사진도 예쁘고, 여행 사이 템포를 잠깐 낮추기 좋은 장소예요.",
    address: "대전 중구 보문로205번길 13",
    imageUrl:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
    friendName: "태호",
    friendNote: "빨리빨리 이동하는 코스보다 이런 곳 한 군데 섞이면 여행이 훨씬 기억에 남아.",
    saveCount: 4,
    baseSaveCount: 4,
    saved: false,
    createdLabel: "태호가 오늘 저장",
    mapPosition: mapPositions[7],
    tags: ["조용한코스", "건축"]
  }
];

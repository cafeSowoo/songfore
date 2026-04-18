import { mapPositions } from "../lib/api.js";

export const tripMeta = {
  slug: "dj",
  title: "송포레 대전 여행",
  subtitle: "8명이 함께 고르는 대전 스팟",
  description:
    "친구들이 가고 싶은 장소를 저장하고 바로 일정으로 옮겨보는 대전 여행 위시리스트 보드",
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
      "튀김소보로 하나만으로도 여행 텐션이 올라가는 대표 스팟이에요. 빵 쇼핑 후 근처 골목을 천천히 걷기에도 좋아요.",
    address: "대전 중구 대종로480번길 15",
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
    friendName: "지원",
    friendNote: "아침에 여기서 빵 한가득 사서 숙소 가면 여행 시작 느낌 제대로 날 듯!",
    saveCount: 6,
    baseSaveCount: 6,
    saved: false,
    createdLabel: "지원이 2시간 전 추천",
    mapPosition: mapPositions[0],
    comments: []
  },
  {
    id: "oc-kalguksu",
    name: "오씨칼국수",
    category: "restaurant",
    reason: "해물칼국수랑 파전 조합이 든든해서 첫 끼나 해장 코스로 좋을 것 같아요.",
    description:
      "진한 국물과 바삭한 파전이 같이 나와서 여행 첫날 에너지 채우기 좋아요. 웨이팅이 있어도 한 번쯤 가볼 만한 집이에요.",
    address: "대전 동구 옛신탄진로 13",
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
    friendName: "민호",
    friendNote: "우리 아침 느긋하게 시작하면 여기서 칼국수 먹고 이동하면 딱일 듯.",
    saveCount: 4,
    baseSaveCount: 4,
    saved: true,
    createdLabel: "민호가 어제 추천",
    mapPosition: mapPositions[1],
    comments: []
  },
  {
    id: "hanbat-arboretum",
    name: "한밭수목원",
    category: "etc",
    reason: "중간에 쉬어가기 좋고, 초록 뷰 사진이 잘 나와서 산책 코스로 딱이에요.",
    description:
      "실내 스팟 위주 일정 사이에 넣으면 여행 흐름이 훨씬 부드러워져요. 도심 안에서 여유를 느끼기 좋은 장소예요.",
    address: "대전 서구 둔산대로 169",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    friendName: "유진",
    friendNote: "여기서 시간 맞춰 쉬었다 가면 다같이 사진 남기기 좋을 것 같아.",
    saveCount: 5,
    baseSaveCount: 5,
    saved: false,
    createdLabel: "유진이 오늘 추천",
    mapPosition: mapPositions[2],
    comments: []
  },
  {
    id: "shinsegae-art-science",
    name: "대전신세계 Art & Science",
    category: "tour",
    reason: "쇼핑도 하고 실내 구경도 할 수 있어서 비 오는 날 플랜으로도 좋아요.",
    description:
      "백화점 이상으로 복합 스팟 느낌이라 이동 스트레스가 적고, 사진 찍을 포인트도 많아요.",
    address: "대전 유성구 엑스포로 1",
    imageUrl:
      "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=900&q=80",
    friendName: "현우",
    friendNote: "실내 코스 하나쯤 있어야 해서 대안으로 두기 너무 좋아 보여.",
    saveCount: 3,
    baseSaveCount: 3,
    saved: false,
    createdLabel: "현우가 어제 추천",
    mapPosition: mapPositions[3],
    comments: []
  },
  {
    id: "soje-dong",
    name: "소제동 카페 거리",
    category: "cafe",
    reason: "감성적인 골목 분위기 덕분에 카페 투어하고 사진 남기기 최고예요.",
    description:
      "오래된 건물과 새 카페가 섞여 있어서 대전 특유의 분위기를 느끼기 좋아요. 가볍게 걷다가 마음에 드는 곳 들어가기 좋아요.",
    address: "대전 동구 소제동 일대",
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
    friendName: "서윤",
    friendNote: "카페 하나 정해놓기보다 여기서 골라 들어가는 재미가 있을 것 같아.",
    saveCount: 7,
    baseSaveCount: 7,
    saved: true,
    createdLabel: "서윤이 30분 전 추천",
    mapPosition: mapPositions[4],
    comments: []
  },
  {
    id: "dadong-sky-park",
    name: "대동하늘공원",
    category: "tour",
    reason: "야경이 예뻐서 하루 마무리 장소로 분위기 있게 딱 좋을 것 같아요.",
    description:
      "대전 시내를 시원하게 내려다볼 수 있는 뷰 포인트예요. 해질 무렵에 올라가면 사진도 정말 잘 나와요.",
    address: "대전 동구 자양동 산4-1",
    imageUrl:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80",
    friendName: "하은",
    friendNote: "첫날 밤에 여기 가면 여행 기억이 되게 오래 남을 것 같아.",
    saveCount: 5,
    baseSaveCount: 5,
    saved: false,
    createdLabel: "하은이 어젯밤 추천",
    mapPosition: mapPositions[5],
    comments: []
  },
  {
    id: "daeheung-winebar",
    name: "대흥동 와인바 골목",
    category: "shopping",
    reason: "저녁 먹고 나서 슬쩍 들르기 좋은 분위기라 대안 코스로 넣어두고 싶어요.",
    description:
      "너무 시끄럽지 않고 대화하기 좋은 바들이 모여 있어서 일정 끝나고 가볍게 모이기 좋아요.",
    address: "대전 중구 대흥동 일대",
    imageUrl:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80",
    friendName: "지호",
    friendNote: "숙소 들어가기 전에 한 군데만 골라서 가도 분위기 있을 것 같아.",
    saveCount: 2,
    baseSaveCount: 2,
    saved: false,
    createdLabel: "지호가 방금 추천",
    mapPosition: mapPositions[6],
    comments: []
  },
  {
    id: "temi-orae",
    name: "테미오래",
    category: "etc",
    reason: "조용하게 둘러보면 대전의 분위기를 천천히 느끼기 좋을 것 같아요.",
    description:
      "근대 관사촌을 리뉴얼한 공간이라 사진도 예쁘고, 여행 사이 템포를 조금 낮추기 좋아요.",
    address: "대전 중구 보문로205번길 13",
    imageUrl:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
    friendName: "태오",
    friendNote: "바쁘게 이동하는 코스보다 이런 곳 한 군데 있으면 여행이 더 기억에 남아.",
    saveCount: 4,
    baseSaveCount: 4,
    saved: false,
    createdLabel: "태오가 오늘 추천",
    mapPosition: mapPositions[7],
    comments: []
  }
];

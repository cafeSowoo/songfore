export const sampleTrip = {
  trip: {
    slug: "dj",
    title: "대전 독서모임 여행",
    description: "먹고, 걷고, 쇼핑하고, 오래 이야기할 수 있는 장소를 함께 모으는 보드"
  },
  categories: [
    { id: "all", label: "전체", color: "#1e1e1e" },
    { id: "restaurant", label: "식당", color: "#df5b44" },
    { id: "cafe", label: "카페", color: "#b78952" },
    { id: "shopping", label: "쇼핑", color: "#4b7cf6" },
    { id: "tour", label: "관광지", color: "#2e9b60" },
    { id: "stay", label: "숙소", color: "#7e63d8" },
    { id: "etc", label: "기타", color: "#6f727d" }
  ],
  places: [
    {
      id: "place-1",
      category: "restaurant",
      name: "성심당 DCC점",
      address: "대전 유성구 엑스포로 107",
      latitude: 36.376195,
      longitude: 127.386541,
      description: "빵 사서 숙소나 공원으로 이동하기 좋아 보여요.",
      author: "지수",
      createdAt: "2026-04-10T10:00:00+09:00",
      comments: [
        {
          id: "comment-1",
          author: "민호",
          content: "여기는 거의 확정 느낌이에요. 아침 코스로도 좋을 듯.",
          createdAt: "2026-04-10T10:12:00+09:00"
        }
      ]
    },
    {
      id: "place-2",
      category: "tour",
      name: "한밭수목원",
      address: "대전 서구 둔산대로 169",
      latitude: 36.368123,
      longitude: 127.388951,
      description: "산책하면서 이야기하기 좋은 장소. 사진도 예쁘게 나올 것 같아요.",
      author: "보람",
      createdAt: "2026-04-10T10:20:00+09:00",
      comments: [
        {
          id: "comment-2",
          author: "태윤",
          content: "카페 들렀다가 여기로 넘어가면 동선 괜찮겠네요.",
          createdAt: "2026-04-10T10:28:00+09:00"
        }
      ]
    },
    {
      id: "place-3",
      category: "shopping",
      name: "대전신세계 Art & Science",
      address: "대전 유성구 엑스포로 1",
      latitude: 36.377607,
      longitude: 127.381123,
      description: "쇼핑과 식사를 한 번에 해결하기 좋아 보여요.",
      author: "유진",
      createdAt: "2026-04-10T10:44:00+09:00",
      comments: []
    },
    {
      id: "place-4",
      category: "cafe",
      name: "테미오래 근처 로스터리 카페",
      address: "대전 중구 테미로 일대",
      latitude: 36.321921,
      longitude: 127.419394,
      description: "조용하게 앉아서 독서모임 느낌 내기 좋은 후보.",
      author: "서현",
      createdAt: "2026-04-10T11:02:00+09:00",
      comments: [
        {
          id: "comment-3",
          author: "하준",
          content: "여기 가면 사진 분위기 좋을 것 같아요.",
          createdAt: "2026-04-10T11:18:00+09:00"
        }
      ]
    }
  ]
};

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
      description: "비 온 뒤 산책하고 공원 쪽으로 이동하기 좋아 보여요.",
      author: "지석",
      createdAt: "2026-04-10T10:00:00+09:00",
      comments: [
        {
          id: "comment-1",
          author: "민호",
          content: "여기면 대전 분위기 시작점으로도 좋을 듯해요.",
          createdAt: "2026-04-10T10:12:00+09:00"
        }
      ]
    },
    {
      id: "place-2",
      category: "tour",
      name: "소제동 골목",
      address: "대전 동구 철갑2길 8",
      latitude: 36.334531,
      longitude: 127.442716,
      description: "걷다 보면 사진도 잘 나오고 카페 이어가기 좋을 것 같아요.",
      author: "보람",
      createdAt: "2026-04-10T10:20:00+09:00",
      comments: [
        {
          id: "comment-2",
          author: "세윤",
          content: "카페랑 이어서 묶으면 동선이 괜찮을 것 같아요.",
          createdAt: "2026-04-10T10:28:00+09:00"
        }
      ]
    },
    {
      id: "place-3",
      category: "shopping",
      name: "신세계 Art & Science",
      address: "대전 유성구 엑스포로 1",
      latitude: 36.377607,
      longitude: 127.381123,
      description: "쇼핑이랑 식사를 한 번에 해결하기 좋아 보여요.",
      author: "유진",
      createdAt: "2026-04-10T10:44:00+09:00",
      comments: []
    }
  ]
};

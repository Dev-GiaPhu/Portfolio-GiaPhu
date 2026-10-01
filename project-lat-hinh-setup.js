/*
  ============================================================
  LẬT HÌNH TÌM CẶP — FILE DUY NHẤT CẦN SỬA
  ============================================================

  - Đổi text, tên ảnh, mô tả, link GitHub, đường dẫn WebGL tại đây.
  - Ảnh dự án nên upload vào:
    assets/projects/lat-hinh-tim-cap/
  - Build WebGL upload vào:
    games/lat-hinh-tim-cap/
  - Không cần sửa project-lat-hinh.html hay project-page.js.
*/

window.PROJECT_SETUP = {
  pageTitle: "Lật Hình Tìm Cặp — Nguyễn Gia Phú",
  metaDescription:
    "Lật Hình Tìm Cặp — dự án Unity của Nguyễn Gia Phú với vai trò lập trình viên.",

  indexLabel: "Dự án nổi bật / 02",
  nameLines: ["LẬT HÌNH", "TÌM CẶP."],
  introduction:
    "Tôi tham gia dự án Lật Hình Tìm Cặp với vai trò lập trình viên, tập trung vào luồng chơi, xử lý tương tác lật thẻ và giao diện trong Unity.",

  heroImage: "assets/projects/lat-hinh-tim-cap/hero.jpg",
  heroAlt: "Lật Hình Tìm Cặp",
  tags: ["UNITY", "C#", "2D", "UI", "MEMORY GAME"],

  playable: {
    enabled: true,
    eyebrow: "PLAYABLE BUILD / WEBGL",
    titleLines: ["CHƠI LẬT HÌNH", "TÌM CẶP TRÊN WEB."],
    description:
      "Bản WebGL của Lật Hình Tìm Cặp sẽ chạy trực tiếp trong portfolio khi build được upload vào đúng thư mục.",
    playerPage: "play-lat-hinh.html",
    label: "LẬT HÌNH TÌM CẶP / WEBGL"
  },

  galleryTitle: "HÌNH ẢNH & GAMEPLAY.",
  galleryIntro:
    "Một số hình ảnh thể hiện giao diện, cơ chế lật thẻ và quá trình hoàn thiện gameplay của Lật Hình Tìm Cặp.",

  gallery: [
    {
      src: "assets/projects/lat-hinh-tim-cap/gameplay-01.jpg",
      alt: "Gameplay Lật Hình Tìm Cặp",
      label: "GAMEPLAY / 01",
      title: "Cơ chế lật và ghép cặp",
      description:
        "Thay phần này bằng mô tả của bạn về cơ chế lật thẻ, kiểm tra cặp giống nhau hoặc luật chơi.",
      layout: "wide"
    },
    {
      src: "assets/projects/lat-hinh-tim-cap/gameplay-02.jpg",
      alt: "Giao diện Lật Hình Tìm Cặp",
      label: "UI / 02",
      title: "Giao diện tương tác",
      description:
        "Thay phần này bằng mô tả về bố cục màn chơi, nút bấm, trạng thái và phản hồi UI.",
      layout: "normal"
    },
    {
      src: "assets/projects/lat-hinh-tim-cap/gameplay-03.jpg",
      alt: "Quá trình phát triển Lật Hình Tìm Cặp",
      label: "DEVELOPMENT / 03",
      title: "Quá trình phát triển",
      description:
        "Bạn có thể dùng ảnh Unity Editor, scene, prefab hoặc phần logic muốn giới thiệu.",
      layout: "normal"
    }
  ],

  sections: [
    {
      label: "01 / GAMEPLAY",
      title: "Luồng chơi lật hình",
      description:
        "Tôi tham gia xây dựng luồng tương tác lật thẻ, xử lý trạng thái các thẻ và kiểm tra khi người chơi tìm được một cặp phù hợp."
    },
    {
      label: "02 / LOGIC",
      title: "Kiểm tra & quản lý trạng thái",
      description:
        "Phần gameplay cần quản lý thẻ đang mở, khóa tương tác khi cần và đưa thẻ về trạng thái phù hợp sau mỗi lượt chơi."
    },
    {
      label: "03 / UI",
      title: "Giao diện tương tác",
      description:
        "Tôi tham gia triển khai giao diện phục vụ thao tác của người chơi và phản hồi trực quan trong quá trình chơi."
    },
    {
      label: "04 / VAI TRÒ",
      title: "Lập trình viên",
      description:
        "Trong dự án, tôi tham gia với vai trò lập trình viên và tập trung vào việc hiện thực hóa luồng chơi cũng như các tương tác trong Unity."
    }
  ],

  github: {
    enabled: true,
    label: "Xem mã nguồn trên GitHub ↗",
    url: "https://github.com/XTH-CNTT-FPOLY-HCM/GameBooth_LatHinh"
  }
};

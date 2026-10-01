/*
  ============================================================
  FILE DUY NHẤT CẦN SỬA KHI CẬP NHẬT TRANG DỰ ÁN
  ============================================================

  1. Thay text trực tiếp bên dưới.
  2. Ảnh: upload ảnh vào repo rồi đổi "src" thành tên/đường dẫn file.
  3. Muốn thêm ảnh hoặc mục mô tả: copy thêm một object {...}.
  4. Muốn ẩn phần game WebGL: đổi playable.enabled thành false.
  5. Không cần sửa project.html hay project-page.js.
*/

window.PROJECT_SETUP = {
  // Tiêu đề tab trình duyệt và SEO.
  pageTitle: "Oops-Brake — Nguyễn Gia Phú",
  metaDescription:
    "Oops-Brake — dự án Unity của Nguyễn Gia Phú với vai trò trưởng nhóm và lập trình viên.",

  // Phần đầu trang.
  indexLabel: "Dự án nổi bật / 01",
  nameLines: ["OOPS", "BRAKE."],
  introduction:
    "Tôi tham gia Oops Brake với vai trò trưởng nhóm và lập trình viên. Trong quá trình phát triển, tôi cùng nhóm xây dựng gameplay xe 3D, các thành phần giao thông, hiệu ứng và công cụ hỗ trợ làm việc trong Unity.",

  // Ảnh lớn đầu trang.
  heroImage: "assets/world.png",
  heroAlt: "Oops Brake",
  tags: ["UNITY", "C#", "3D", "TRƯỞNG NHÓM"],

  // Game WebGL.
  playable: {
    enabled: true,
    eyebrow: "PLAYABLE BUILD / WEBGL",
    titleLines: ["CHƠI OOPS BRAKE", "NGAY TRÊN WEB."],
    description:
      "Build WebGL chạy trực tiếp trong portfolio. Tôi có thể trải nghiệm bản build ngay tại đây.",
    playerPage: "games/oops-brake/index.html?v=20261001-2318",
    label: "OOPS BRAKE / WEBGL",
    frameless: true
  },

  /*
    HÌNH ẢNH DỰ ÁN
    ----------------------------------------------------------
    Chỉ cần đổi src thành tên file ảnh bạn upload.

    Ví dụ:
    src: "assets/projects/oops-brake/gameplay-01.png"

    layout:
    - "wide"   = ảnh ngang lớn
    - "normal" = ảnh thường
    - "tall"   = ảnh dọc/cao
  */
  galleryTitle: "HÌNH ẢNH & QUÁ TRÌNH PHÁT TRIỂN.",
  galleryIntro:
    "Một số hình ảnh thể hiện gameplay, môi trường và những phần tôi tham gia trong quá trình phát triển Oops Brake.",

  gallery: [
    {
      src: "assets/projects/oops-brake/gameplay-01.jpg",
      alt: "Gameplay Oops Brake",
      label: "GAMEPLAY / 01",
      title: "Điều khiển phương tiện",
      description:
        "Thay đoạn này bằng mô tả của bạn về hình ảnh gameplay hoặc hệ thống đang được thể hiện.",
      layout: "wide"
    },
    {
      src: "assets/projects/oops-brake/gameplay-02.jpg",
      alt: "Traffic trong Oops Brake",
      label: "GAMEPLAY / 02",
      title: "Traffic & môi trường",
      description:
        "Thay đoạn này bằng mô tả về traffic, đường phố, môi trường hoặc phần việc liên quan.",
      layout: "normal"
    },
    {
      src: "assets/projects/oops-brake/gameplay-03.jpg",
      alt: "Unity tooling Oops Brake",
      label: "DEVELOPMENT / 03",
      title: "Quá trình phát triển",
      description:
        "Bạn có thể dùng ảnh Unity Editor, tool, scene hoặc bất kỳ hình nào muốn giới thiệu.",
      layout: "normal"
    }
  ],

  // Các ô mô tả kỹ thuật.
  sections: [
    {
      label: "01 / GAMEPLAY",
      title: "Hệ thống phương tiện",
      description:
        "Trong dự án, tôi làm việc với cấu trúc vehicle catalog, gameplay settings và các tài nguyên liên quan đến xe để phục vụ gameplay điều khiển phương tiện và tương tác trên đường."
    },
    {
      label: "02 / GIAO THÔNG",
      title: "Traffic & môi trường đường",
      description:
        "Tôi cùng nhóm triển khai các thành phần traffic, road dust, mesh và logic phục vụ bối cảnh giao thông, hướng tới trải nghiệm đường phố rõ ràng hơn."
    },
    {
      label: "03 / TOOLING",
      title: "Công cụ hỗ trợ Unity",
      description:
        "Trong quá trình làm việc, nhóm sử dụng các công cụ Editor như Scene Switcher, Vehicle Catalog Editor và Project Builder để hỗ trợ quy trình phát triển trong Unity."
    },
    {
      label: "04 / VAI TRÒ",
      title: "Trưởng nhóm & lập trình viên",
      description:
        "Ngoài lập trình, tôi còn đảm nhiệm vai trò trưởng nhóm, tổ chức công việc và phối hợp quá trình phát triển giữa các thành viên."
    }
  ],

  // Nút cuối trang.
  github: {
    enabled: true,
    label: "Xem mã nguồn trên GitHub ↗",
    url: "https://github.com/Dev-GiaPhu/Oops-Brake"
  }
};

import { useState } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

interface UserData {
  name: string;
  link: string;
}

export default function App() {
  const [users, setUsers] = useState<UserData[]>([
    { name: "참가자 A", link: "https://example.com/" },
  ]);
  const [ticketDate, setTicketDate] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddRow = () => setUsers([...users, { name: "", link: "" }]);

  const handleRemoveRow = (index: number) => {
    const newUsers = [...users];
    newUsers.splice(index, 1);
    setUsers(newUsers);
  };

  const handleChange = (
    index: number,
    field: keyof UserData,
    value: string,
  ) => {
    const newUsers = [...users];
    newUsers[index][field] = value;
    setUsers(newUsers);
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`이미지 로드 실패: ${src}`));
      img.src = src;
    });
  };

  const handleGeneratePDF = async () => {
    const validUsers = users.filter(
      (u) => u.name.trim() !== "" && u.link.trim() !== "",
    );
    if (validUsers.length === 0) {
      alert("최소 1명 이상의 이름과 링크를 입력해주세요.");
      return;
    }

    setIsProcessing(true);
    try {
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const cardWidth = 79;
      const cardHeight = 120;
      const cardsPerPage = 3;
      const startX = (297 - cardWidth * cardsPerPage) / 2;
      const startY = (210 - cardHeight) / 2;

      for (const [index, user] of validUsers.entries()) {
        const canvas = document.createElement("canvas");
        canvas.width = 948;
        canvas.height = 1440;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("카드를 그릴 수 없습니다.");

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#172554";
        ctx.lineWidth = 6;
        ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

        const center = canvas.width / 2;
        ctx.textAlign = "center";
        ctx.fillStyle = "#172554";
        ctx.font = "bold 64px sans-serif";
        ctx.fillText("행사 QR 카드", center, 220);
        ctx.font = "bold 56px sans-serif";
        ctx.fillText(user.name.trim(), center, 1100, canvas.width - 120);
        if (ticketDate) {
          ctx.font = "40px sans-serif";
          ctx.fillText(ticketDate, center, 1220);
        }

        const qrSize = 620;
        const qr = await QRCode.toDataURL(user.link.trim(), { width: qrSize, margin: 4 });
        ctx.drawImage(await loadImage(qr), (canvas.width - qrSize) / 2, 330, qrSize, qrSize);

        const position = index % cardsPerPage;
        if (index > 0 && position === 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/png"), "PNG",
          startX + position * cardWidth, startY, cardWidth, cardHeight);
      }
      pdf.save("qr-cards.pdf");
    } catch {
      alert("PDF를 만들지 못했습니다. 링크를 확인해 주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#f3f4f6",
        minHeight: "100vh",
        padding: "40px 20px",
        fontFamily: '"Pretendard", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          padding: "30px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1
            style={{ color: "#1f2937", fontSize: "24px", margin: "0 0 10px 0" }}
          >
            행사 QR 카드 만들기
          </h1>
          <p style={{ color: "#6b7280", fontSize: "15px", margin: 0 }}>
            이름과 링크를 입력하면 A4 용지 출력용 PDF로 자동 제작됩니다.
          </p>
        </div>

        {/* 날짜 입력 폼 추가 */}
        <div
          style={{
            backgroundColor: "#f9fafb",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            marginBottom: "15px",
          }}
        >
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              color: "#4b5563",
              fontSize: "14px",
              marginBottom: "10px",
            }}
          >
            행사 날짜 (선택)
          </label>
          <input
            type="date"
            value={ticketDate}
            onChange={(e) => setTicketDate(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div
          style={{
            backgroundColor: "#f9fafb",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            marginBottom: "25px",
          }}
        >
          <div
            style={{
              display: "flex",
              marginBottom: "10px",
              fontWeight: "bold",
              color: "#4b5563",
              fontSize: "14px",
            }}
          >
            <div style={{ flex: "1", paddingRight: "10px" }}>
              이름 (하단 표기)
            </div>
            <div style={{ flex: "2", paddingRight: "10px" }}>QR 연결 링크</div>
            <div style={{ width: "40px" }}></div>
          </div>

          {users.map((user, index) => (
            <div
              key={index}
              style={{ display: "flex", gap: "10px", marginBottom: "10px" }}
            >
              <input
                type="text"
                placeholder="예: 참가자 A"
                value={user.name}
                onChange={(e) => handleChange(index, "name", e.target.value)}
                style={{
                  flex: "1",
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                }}
              />
              <input
                type="text"
                placeholder="https://..."
                value={user.link}
                onChange={(e) => handleChange(index, "link", e.target.value)}
                style={{
                  flex: "2",
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                }}
              />
              <button
                onClick={() => handleRemoveRow(index)}
                style={{
                  width: "40px",
                  backgroundColor: "#fee2e2",
                  color: "#ef4444",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={handleAddRow}
            style={{
              width: "100%",
              marginTop: "10px",
              padding: "10px",
              border: "1px dashed #9ca3af",
              borderRadius: "6px",
              background: "none",
              color: "#6b7280",
              cursor: "pointer",
            }}
          >
            + 항목 추가하기
          </button>
        </div>

        <button
          onClick={handleGeneratePDF}
          disabled={isProcessing}
          style={{
            width: "100%",
            padding: "16px",
            backgroundColor: isProcessing ? "#9ca3af" : "#ea580c",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: isProcessing ? "not-allowed" : "pointer",
          }}
        >
          {isProcessing ? "PDF 생성 중... ⏳" : "A4 출력용 PDF 다운로드 🖨️"}
        </button>
      </div>
    </div>
  );
}

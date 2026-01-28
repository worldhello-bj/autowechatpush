// --- Helper: Base64 to Blob ---
export const dataURLtoBlob = (dataurl: string): Blob => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

// --- Helper: Create Default Cover Image (Canvas) ---
export const createDefaultCoverBlob = (titleText: string = "AI Article"): Promise<Blob> => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        // WeChat cover ratio is roughly 2.35:1 (900x383 is a standard safe size)
        canvas.width = 900;
        canvas.height = 383; 
        const ctx = canvas.getContext('2d');
        if (ctx) {
             // 1. Create a nice gradient background (Emerald Green theme)
             const gradient = ctx.createLinearGradient(0, 0, 900, 383);
             gradient.addColorStop(0, '#10b981'); // Emerald 500
             gradient.addColorStop(1, '#047857'); // Emerald 700
             ctx.fillStyle = gradient;
             ctx.fillRect(0, 0, canvas.width, canvas.height);

             // 2. Add decorative pattern/border
             ctx.lineWidth = 8;
             ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
             ctx.strokeRect(20, 20, 860, 343);

             // 3. Add Article Title
             ctx.fillStyle = '#ffffff';
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             
             // Dynamic font sizing based on title length
             const fontSize = titleText.length > 15 ? 48 : 64;
             ctx.font = `bold ${fontSize}px "Noto Sans SC", sans-serif`;
             
             // Simple truncation if text is extremely long
             const displayTitle = titleText.length > 25 ? titleText.substring(0, 25) + '...' : titleText;
             
             // Shadow for text
             ctx.shadowColor = "rgba(0,0,0,0.3)";
             ctx.shadowBlur = 10;
             ctx.shadowOffsetX = 2;
             ctx.shadowOffsetY = 2;

             ctx.fillText(displayTitle, 450, 160);
             
             // 4. Add App Name / Footer text
             ctx.font = '30px sans-serif';
             ctx.shadowBlur = 0; // Reset shadow
             ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
             ctx.fillText('WeChat AI Publisher', 450, 240);
        }
        
        // Export as JPEG (WeChat requires JPG/PNG)
        canvas.toBlob((blob) => {
             resolve(blob || new Blob());
        }, 'image/jpeg', 0.9);
    });
}

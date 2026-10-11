async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser or this webpage does not allow camera access.");
        return false;
    }

    if (cameraStream !== null) {
        cameraPreview.srcObject = cameraStream;
        return true;
    }

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 960 },
                facingMode: "user"
            },
            audio: false
        });

        cameraPreview.srcObject = cameraStream;

        await cameraPreview.play();

        return true;
    } catch (error) {
        console.error("Camera error:", error);

        alert(
            "The camera could not open. Make sure camera permission is allowed " +
            "and open the project in its own HTTPS webpage."
        );

        return false;
    }
}



function capturePhoto() {
    const canvas = document.createElement("canvas");

    canvas.width = cameraPreview.videoWidth;
    canvas.height = cameraPreview.videoHeight;

    const context = canvas.getContext("2d");

    context.drawImage(
        cameraPreview,
        0,
        0,
        canvas.width,
        canvas.height
    );

    capturedPhotos.push(canvas.toDataURL("image/png"));
}
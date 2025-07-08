document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const previewContent = document.getElementById('previewContent');
    const uploadForm = document.getElementById('uploadForm');

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            showPreview(file);
        }
    });

    function showPreview(file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            const fileType = file.type;
            let previewElement;

            if (fileType.startsWith('image/')) {
                previewElement = document.createElement('img');
                previewElement.src = e.target.result;
                previewElement.alt = file.name;
            } else if (fileType.startsWith('video/')) {
                previewElement = document.createElement('video');
                previewElement.src = e.target.result;
                previewElement.controls = true;
            }

            if (previewElement) {
                previewContent.innerHTML = '';
                previewContent.appendChild(previewElement);
                previewContainer.style.display = 'block';
            }
        };

        reader.readAsDataURL(file);
    }

    uploadForm.addEventListener('submit', function(e) {
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = '업로드 중...';
    });
});
function showSuccessAlert(message, redirectUrl) {
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: message,
      customClass: {
        popup: 'bg-[#F4F7FF] dark:bg-gray-800 text-[#333] dark:text-gray-200',
        title: 'text-[#1a202c] dark:text-gray-100',
        confirmButton: 'bg-[#1a202c] text-white dark:bg-gray-700',
        cancelButton: 'bg-[#e53e3e] text-white dark:bg-green-600'
      }
    }).then(() => {
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    });
  }
  
  function showErrorAlert(errorList) {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      html: errorList,
      customClass: {
        popup: 'bg-[#F4F7FF] dark:bg-gray-800 text-[#333] dark:text-gray-200',
        title: 'text-[#1a202c] dark:text-gray-100',
        confirmButton: 'bg-[#1a202c] text-white dark:bg-gray-700',
        cancelButton: 'bg-[#e53e3e] text-white dark:bg-red-600'
      }
    });
  }
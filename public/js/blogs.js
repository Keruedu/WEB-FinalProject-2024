// public/js/blogs.js
document.addEventListener('DOMContentLoaded', function() {
  attachBookmarkEvents();
  updateBlogLinksAndStatus();
});


function updateBlogLinksAndStatus() {
    const links = document.querySelectorAll('.dynamic-link');
    
    links.forEach(link => {
      const blogId = link.getAttribute('data-blog-id');
      let currentPath = window.location.pathname;
      
      if (currentPath.includes('user')) {
        currentPath = currentPath.split('user')[0] + 'blogs';
      } else if (currentPath.includes('admin')) {
        currentPath = currentPath.split('admin')[0] + 'my-blogs';
      } else if (currentPath.includes('blogs')) {
        currentPath = currentPath.split('blogs')[0] + 'blogs';
      }
      
      const newPath = `${currentPath}/${blogId}`;
      link.href = newPath;
    });
  
    const blogStatuses = document.querySelectorAll('.blog-status');
    const statusDropdowns = document.querySelectorAll('.status-dropdown');
    
    if (window.location.pathname.includes('my-blogs')) {
      blogStatuses.forEach(status => {
        status.classList.remove('hidden');
      });
    } else if (window.location.pathname.includes('admin')) {
      statusDropdowns.forEach(dropdown => {
        dropdown.classList.remove('hidden');
      });
    }
  }
  
  function attachBookmarkEvents() {
    const bookmarkButtons = document.querySelectorAll('.bookmarkButton');
  
    bookmarkButtons.forEach(button => {
      button.addEventListener('click', function() {
        const blogId = this.getAttribute('data-blog-id');
        const isBookmarked = this.classList.contains('bg-primary');
        const url = isBookmarked ? `/bookmark/${blogId}` : `/bookmark/${blogId}`;
        const method = isBookmarked ? 'DELETE' : 'POST';
  
        $.ajax({
          url: url,
          method: method,
          success: function(response) {
            if (response.success) {
              if (isBookmarked) {
                button.classList.remove('bg-primary');
              } else {
                button.classList.add('bg-primary');
              }
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: response.message,
                customClass: {
                  popup: 'bg-[#F4F7FF] dark:bg-gray-800 text-[#333] dark:text-gray-200',
                  title: 'text-[#1a202c] dark:text-gray-100',
                  confirmButton: 'bg-[#1a202c] text-white dark:bg-gray-700',
                  cancelButton: 'bg-[#e53e3e] text-white dark:bg-red-600'
                }
              });
            }
          },
          error: function(xhr) {
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: xhr.responseJSON.message,
              customClass: {
                popup: 'bg-[#F4F7FF] dark:bg-gray-800 text-[#333] dark:text-gray-200',
                title: 'text-[#1a202c] dark:text-gray-100',
                confirmButton: 'bg-[#1a202c] text-white dark:bg-gray-700',
                cancelButton: 'bg-[#e53e3e] text-white dark:bg-red-600'
              }
            });
          }
        });
      });
    });
  }
  
  function handleSearchFormSubmit(event) {
    event.preventDefault(); // Ngăn hành vi mặc định của form
  
    const url = $(this).attr('action') || window.location.pathname;
    let data = $(this)
      .serializeArray()
      .filter(field => field.name !== 'page' && field.value.trim() !== '');
    
    console.log(data);
    $.ajax({
      url: url,
      method: 'GET',
      data: $.param(data),
      success: function(response) {
        if (response.blogsHtml && response.paginationHtml) {
          $('#blogContainer').html(response.blogsHtml);
          $('#paginationContainer').html(response.paginationHtml);
  
          const newUrl = `${url}?${$.param(data)}`;
          window.history.pushState({ path: newUrl }, '', newUrl);
          attachBookmarkEvents();
          updateBlogLinksAndStatus();
          
        } else {
          console.error('Unexpected response format:', response);
        }
      },
      error: function(xhr) {
        console.error('Error:', xhr);
        alert('Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại!');
      },
    });
  }
  
  function handlePaginationClick(event) {
    event.preventDefault(); // Ngăn hành vi mặc định của link
  
    const href = $(this).attr('href'); // Lấy giá trị href
    const url = new URL(href, window.location.origin); // Tạo URL đầy đủ
    const page = url.searchParams.get('page'); // Lấy giá trị của tham số "page"
    const formData = $('#searchForm')
      .serializeArray()
      .filter(field => field.name !== 'page' && field.value.trim() !== ''); // Loại bỏ trường page nếu đã tồn tại
  
    if (page > 1)
      formData.push({ name: 'page', value: page });
  
    $.ajax({
      url: $('#searchForm').attr('action') || window.location.pathname,
      method: 'GET',
      data: $.param(formData),
      success: function(response) {
        if (response.blogsHtml && response.paginationHtml) {
          $('#blogContainer').html(response.blogsHtml);
          $('#paginationContainer').html(response.paginationHtml);
          const newUrl = `${url.pathname}?${$.param(formData)}`;
          window.history.pushState({ path: newUrl }, '', newUrl);
          attachBookmarkEvents();
          updateBlogLinksAndStatus();
        } else {
          console.error('Unexpected response format:', response);
        }
      },
      error: function(xhr) {
        console.error('Error:', xhr);
        alert('Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại!');
      },
    });      
  }
  
  function handlePopState(event) {
    const path = event.state ? event.state.path : window.location.href;
  
    if (!window.location.href.includes(window.location.pathname)) {
      // Chuyển hướng đến trang hiện tại nếu đường dẫn không phải là trang hiện tại
      window.location.replace(window.location.pathname);
    } else {
      // Thực hiện AJAX để tải nội dung động
      $.ajax({
        url: path,
        method: 'GET',
        success: function(response) {
          if (response.blogsHtml && response.paginationHtml) {
            $('#blogContainer').html(response.blogsHtml);
            $('#paginationContainer').html(response.paginationHtml);
            attachBookmarkEvents();
            updateBlogLinksAndStatus();
          } else {
            console.error('Unexpected response format:', response);
          }
        },
        error: function(xhr) {
          console.error('Error:', xhr);
          alert('Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại!');
        },
      });
    }
  }

  function deleteBlogs(ids) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      customClass: {
        popup: 'bg-[#F4F7FF] dark:bg-gray-800 text-[#333] dark:text-gray-200',
        title: 'text-[#1a202c] dark:text-gray-100',
        confirmButton: 'bg-[#1a202c] text-white dark:bg-gray-700',
        cancelButton: 'bg-[#e53e3e] text-white dark:bg-red-600'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: '/my-blogs',
          method: 'DELETE',
          data: { ids: Array.isArray(ids) ? ids : [ids] },
          success: function(response) {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Your blog(s) have been deleted.',
              customClass: {
                popup: 'bg-[#F4F7FF] dark:bg-gray-800 text-[#333] dark:text-gray-200',
                title: 'text-[#1a202c] dark:text-gray-100',
                confirmButton: 'bg-[#1a202c] text-white dark:bg-gray-700',
                cancelButton: 'bg-[#e53e3e] text-white dark:bg-red-600'
              }
            }).then(() => {
              location.reload();
            });
          },
          error: function(xhr) {
            console.error('Error:', xhr);
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'There was an error deleting the blog(s). Please try again.',
              customClass: {
                popup: 'bg-[#F4F7FF] dark:bg-gray-800 text-[#333] dark:text-gray-200',
                title: 'text-[#1a202c] dark:text-gray-100',
                confirmButton: 'bg-[#1a202c] text-white dark:bg-gray-700',
                cancelButton: 'bg-[#e53e3e] text-white dark:bg-red-600'
              }
            });
          }
        });
      }
    });
  }
  
  $(document).ready(function () {

    // Xử lý submit form tìm kiếm
    $('#searchForm').on('submit', handleSearchFormSubmit);
  
    // Xử lý click vào nút phân trang
    $('#paginationContainer').on('click', 'a', handlePaginationClick);
  
    // Xử lý sự kiện popstate để tải lại các đối tượng cũ khi người dùng nhấn nút "Quay lại" hoặc "Tiến tới"
    window.addEventListener('popstate', handlePopState);
  
    // Gọi các hàm khởi tạo
    attachBookmarkEvents();
    updateBlogLinksAndStatus();

    document.getElementById('dropdownButton').addEventListener('click', function() {
        var dropdown = document.getElementById('dropdown');
        if (dropdown.classList.contains('hidden')) {
          dropdown.classList.remove('hidden');
          dropdown.classList.add('flex');
        } else {
          dropdown.classList.add('hidden');
        }
      });
  });
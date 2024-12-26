function generateBlogHtml(blog) {
    return `
      <div class="w-full px-4 md:w-1/2 lg:w-1/3">
        <div class="mb-10 wow fadeInUp group" data-wow-delay=".1s">
          <div class="mb-8 overflow-hidden rounded-[5px] w-full">
            <a href="javascript:void(0)" class="dynamic-link block h-60">
              <img src="${blog.imageUrl || '/path/to/default-image.jpg'}" alt="image"
                class="w-full h-full transition group-hover:rotate-6 group-hover:scale-125 object-cover" />
            </a>
          </div>
          <div>
            <div class="flex flex-row justify-between mb-6">
              <span class="inline-block px-4 py-0.5 text-xs font-medium leading-loose text-center text-white rounded-[5px] bg-primary">
                ${blog.createdAt ? new Date(blog.createdAt).toDateString() : 'Unknown Date'}
              </span>
              <div class="flex flex-row gap-5">
                <!-- view -->
                <p class="flex items-center text-sm font-medium text-dark dark:text-white">
                  <span class="mr-3">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="fill-current">
                      <path d="M7.9998 5.92505C6.8498 5.92505 5.9248 6.85005 5.9248 8.00005C5.9248 9.15005 6.8498 10.075 7.9998 10.075C9.1498 10.075 10.0748 9.15005 10.0748 8.00005C10.0748 6.85005 9.1498 5.92505 7.9998 5.92505ZM7.9998 8.95005C7.4748 8.95005 7.0498 8.52505 7.0498 8.00005C7.0498 7.47505 7.4748 7.05005 7.9998 7.05005C8.5248 7.05005 8.9498 7.47505 8.9498 8.00005C8.9498 8.52505 8.5248 8.95005 7.9998 8.95005Z"></path>
                      <path d="M15.3 7.1251C13.875 5.0001 11.9 2.8501 8 2.8501C4.1 2.8501 2.125 5.0001 0.7 7.1251C0.35 7.6501 0.35 8.3501 0.7 8.8751C2.125 10.9751 4.1 13.1501 8 13.1501C11.9 13.1501 13.875 10.9751 15.3 8.8751C15.65 8.3251 15.65 7.6501 15.3 7.1251ZM14.375 8.2501C12.55 10.9251 10.725 12.0251 8 12.0251C5.275 12.0251 3.45 10.9251 1.625 8.2501C1.525 8.1001 1.525 7.9001 1.625 7.7501C3.45 5.0751 5.275 3.9751 8 3.9751C10.725 3.9751 12.55 5.0751 14.375 7.7501C14.45 7.9001 14.45 8.1001 14.375 8.2501Z"></path>
                    </svg>
                  </span>
                  ${blog.views || 0}
                </p>
                <!--Category-->
                <span class="inline-block px-4 py-0.5 text-xs font-medium leading-loose text-center text-white rounded-[5px] bg-secondary">
                  ${blog.category?.name || 'No Category'}
                </span>
              </div>
            </div>
            <h3>
              <a href="javascript:void(0)"
                class="dynamic-link inline-block mb-4 text-xl font-semibold text-dark dark:text-white hover:text-primary dark:hover:text-primary sm:text-2xl lg:text-xl xl:text-2xl">
                ${blog.title || 'No Title'}
              </a>
            </h3>
            <p class="max-w-[370px] text-base text-body-color dark:text-dark-6">
              ${blog.content ? (blog.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' - ').substring(0, 100)) : 'No Content Available'}...
            </p>
          </div>
        </div>
      </div>
    `;
  }


  function generatePaginationHtml(currentPage, hasPreviousPage, hasNextPage, previousPage, nextPage, lastPage, oldUrl) {
    const generateUrl = (page) => {
      let url = oldUrl;
  
      // Remove old `page` parameter if it exists
      url = url.replace(/([?&])page=\d+(&|$)/, (match, p1, p2) => (p2 === '&' ? p1 : ''));
  
      // Add new `page` parameter
      if (url.includes('?')) {
        url += '&page=' + page;
      } else {
        url += '?page=' + page;
      }
  
      return url;
    };
  
    let paginationHtml = `
      <div class="inline-flex p-3 bg-white dark:bg-dark-2 border rounded-[10px] border-stroke dark:border-dark-3">
        <ul class="flex items-center -mx-1">
    `;
  
    if (hasPreviousPage) {
      paginationHtml += `
        <li class="px-1">
          <a href="${generateUrl(previousPage)}"
            class="flex items-center justify-center text-base bg-transparent border rounded-md hover:border-primary hover:bg-primary h-[34px] w-[34px] border-stroke dark:border-dark-3 text-body-color dark:text-dark-6 hover:text-white dark:hover:border-primary dark:hover:text-white">
            <span>
              <svg width="8" height="15" viewBox="0 0 8 15" class="fill-current stroke-current">
                <path
                  d="M7.12979 1.91389L7.1299 1.914L7.1344 1.90875C7.31476 1.69833 7.31528 1.36878 7.1047 1.15819C7.01062 1.06412 6.86296 1.00488 6.73613 1.00488C6.57736 1.00488 6.4537 1.07206 6.34569 1.18007L6.34564 1.18001L6.34229 1.18358L0.830207 7.06752C0.830152 7.06757 0.830098 7.06763 0.830043 7.06769C0.402311 7.52078 0.406126 8.26524 0.827473 8.73615L0.827439 8.73618L0.829982 8.73889L6.34248 14.6014L6.34243 14.6014L6.34569 14.6047C6.546 14.805 6.88221 14.8491 7.1047 14.6266C7.30447 14.4268 7.34883 14.0918 7.12833 13.8693L1.62078 8.01209C1.55579 7.93114 1.56859 7.82519 1.61408 7.7797L1.61413 7.77975L1.61729 7.77639L7.12979 1.91389Z"
                  stroke-width="0.3" />
              </svg>
            </span>
          </a>
        </li>
      `;
    }
  
    for (let i = 1; i <= lastPage; i++) {
      paginationHtml += `
        <li class="px-1">
          <a href="${generateUrl(i)}"
            class="flex items-center justify-center text-base bg-transparent border rounded-md h-[34px] w-[34px] border-stroke dark:border-dark-3  hover:border-primary hover:bg-primary hover:text-white dark:hover:border-primary dark:hover:text-white ${currentPage === i ? 'bg-primary text-dark dark:text-white' : 'text-body-color dark:text-dark-6'}">
            ${i}
          </a>
        </li>
      `;
    }
  
    if (hasNextPage) {
      paginationHtml += `
        <li class="px-1">
          <a href="${generateUrl(nextPage)}"
            class="flex items-center justify-center text-base bg-transparent border rounded-md hover:border-primary hover:bg-primary h-[34px] w-[34px] border-stroke dark:border-dark-3 text-body-color dark:text-dark-6 hover:text-white dark:hover:border-primary dark:hover:text-white">
            <span>
              <svg width="8" height="15" viewBox="0 0 8 15" class="fill-current stroke-current">
                <path
                  d="M0.870212 13.0861L0.870097 13.086L0.865602 13.0912C0.685237 13.3017 0.684716 13.6312 0.895299 13.8418C0.989374 13.9359 1.13704 13.9951 1.26387 13.9951C1.42264 13.9951 1.5463 13.9279 1.65431 13.8199L1.65436 13.82L1.65771 13.8164L7.16979 7.93248C7.16985 7.93243 7.1699 7.93237 7.16996 7.93231C7.59769 7.47923 7.59387 6.73477 7.17253 6.26385L7.17256 6.26382L7.17002 6.26111L1.65752 0.398611L1.65757 0.398563L1.65431 0.395299C1.454 0.194997 1.11779 0.150934 0.895299 0.373424C0.695526 0.573197 0.651169 0.908167 0.871667 1.13067L6.37922 6.98791C6.4442 7.06886 6.43141 7.17481 6.38592 7.2203L6.38587 7.22025L6.38271 7.22361L0.870212 13.0861Z"
                  stroke-width="0.3" />
              </svg>
            </span>
          </a>
        </li>
      `;
    }
  
    paginationHtml += `
        </ul>
      </div>
    `;
  
    return paginationHtml;
  }
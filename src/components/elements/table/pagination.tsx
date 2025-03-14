import React from 'react';

interface PaginationProps {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, pageCount, onPageChange }) => {
 
  const pagesToShow = 5; // This determines how many pages to show around the current page.
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  const getVisiblePages = () => {
    if (pageCount <= pagesToShow + 2) { // 2 accounts for the first and last page
      return pages;
    }

    const visiblePages = [1]; 

    let startPage = Math.max(2, currentPage - Math.floor(pagesToShow / 2)); 
    let endPage = Math.min(pageCount - 1, currentPage + Math.floor(pagesToShow / 2)); 

    if (currentPage <= Math.ceil(pagesToShow / 2)) {
      endPage = pagesToShow;
    } else if (currentPage >= pageCount - Math.floor(pagesToShow / 2)) {
      startPage = pageCount - pagesToShow;
    }

    for (let i = startPage; i <= endPage; i++) {
      visiblePages.push(i);
    }

    visiblePages.push(pageCount); 

    return visiblePages;
  };

  const visiblePages = getVisiblePages();

  return (
    <nav style={{ flex: '1' }}>
      <ul className="pagination">
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
            {`<`}
          </button>
        </li>
        {visiblePages.map((page, index) => (
          <React.Fragment key={page}>
            {(index === 1 && page !== 2) && <li className="page-item disabled"><span className="page-link">...</span></li>}
            <li className={`page-item ${currentPage === page ? 'active' : ''}`}>
              <button className="page-link" onClick={() => onPageChange(page)}>
                {page}
              </button>
            </li>
            {(index === visiblePages.length - 2 && page !== pageCount - 1) && <li className="page-item disabled"><span className="page-link">...</span></li>}
          </React.Fragment>
        ))}
        <li className={`page-item ${currentPage === pageCount ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === pageCount}>
            {`>`}
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;

const defaultHeaders = {
  "Content-Type": "application/json",
};

export const zat = async (url, body, method, queryParams = null) => {
  try {
    const headers = { ...defaultHeaders };

    // Remove Content-Type if FormData is used
    if (body instanceof FormData) {
      delete headers["Content-Type"];
    }

    // Request options
    const requestOptions = {
      method,
      headers,
      credentials: "include", // Include cookies in cross-origin requests
    };

    // Handle query parameters
    if (queryParams && (method === "GET" || method === "DELETE" || method === "PUT")) {
      const params = new URLSearchParams(queryParams);
      url += `?${params.toString()}`;
    }

    // Set body
    if (body) {
      requestOptions.body = body instanceof FormData ? body : JSON.stringify(body);
    }

    // Perform the fetch
    const response = await fetch(url, requestOptions);

    // Handle error statuses
    if ([400, 401, 403].includes(response.status)) {
      const errorData = await response.json();
      return { success: false, status: response.status,  errorMessage: errorData.error || errorData };
    }

    // Handle non-OK responses
    if (!response.ok) {
      return { success: false, errorMessage: `Network response was not ok: ${response.statusText}` };
    }

    // Parse the response JSON
    const json = await response.json();

    // Handle DELETE separately if required
    const results = method === "DELETE" ? true : json;

    // Return success result
    return {
      success: true,
      data: results?.data || results,
      totalCount: results?.totalCount
    };
  } catch (error) {
    // Return error result
    return { success: false, status: 500, errorMessage: error.message };
  }
};

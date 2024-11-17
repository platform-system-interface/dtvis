
// A mock function to mimic making an async request for data
export function fetchTree(amount = 1) {
    return new Promise<{ data: any }>((resolve) =>
      setTimeout(() => resolve({ data: amount }), 500)
    );
  }
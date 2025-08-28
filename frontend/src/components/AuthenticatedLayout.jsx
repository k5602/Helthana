"use client"

import AppSidebar from "./AppSidebar"

const AuthenticatedLayout = ({ children }) => {
  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-base-200">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}

export default AuthenticatedLayout

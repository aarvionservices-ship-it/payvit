export function roleRedirect(role: string) {

    if (role === "admin") {
        return "/admin/dashboard"
    }

    if (role === "employee") {
        return "/employee/leads"
    }

    if (role === "customer") {
        return "/customer"
    }

    return "/"
}

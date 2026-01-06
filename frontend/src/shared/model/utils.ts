import { ClassNameValue, twMerge } from "tailwind-merge"

const cn = (...className: ClassNameValue[]) => {
    return twMerge(className);
}

const authHeader = (token: string) => {
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }
}

export {
    cn,
    authHeader
}
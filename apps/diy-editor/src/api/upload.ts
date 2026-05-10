type ApiResponse<T> = { data: T };

const apiBaseUrl = import.meta.env.VITE_NEXAHUB_API_BASE_URL || '';

async function postJson<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${apiBaseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
    });

    const data = (await response.json().catch(() => ({}))) as T;
    if (!response.ok) {
        throw new Error((data as any)?.message || (data as any)?.msg || '请求失败');
    }
    return { data };
}

class UploadAPI {
    /**  分类查询接口*/
    static getTree() {
        return postJson<any>(`/attachmentapi/category`);
    }
    /** 分类新增，修改接口 */
    static saveTree(data: any) {
        return postJson<any>(`/attachmentapi/categorysave`, data);
    }
    /** 分类删除接口 */
    static delTree(data: any) {
        return postJson<any>(`/attachmentapi/categorydelete`, data);
    }
    /** 附件移动分类 */
    static moveTree(data: any) {
        return postJson<any>(`/attachmentapi/movecategory`, data);
    }

    // 附件列表
    static getAttachmentList(data: any) {
        return postJson<any>(`/attachmentapi/list`, data);
    }
    // 附件名称修改
    static saveAttachmentName(data: any) {
        return postJson<any>(`/attachmentapi/save`, data);
    }
    // 附件删除
    static delAttachment(data: any) {
        return postJson<any>(`/attachmentapi/delete`, data);
    }
    // 扫码上传
    static uploadQrcode(data: any) {
        return postJson<any>(`/attachmentapi/scanuploaddata`, data);
    }
    // 提取链接 --------附件远程下载
    static getAttachmentCatch(data: any) {
        return postJson<any>(`/attachmentapi/catch`, data);
    }

    // 图标入库（icon class）
    static addIcon(data: { icon_class: string; category_id?: string }) {
        return postJson<any>(`/attachmentapi/iconadd`, data);
    }
}

export default UploadAPI;

// 分类树结构
export interface Tree {
    /** 主键 */
    id: string;
    /** 父级id */
    pid: string;
    /** 名称 */
    name: string;
    /** 路径 */
    path: string;
    /** 是否开启 */
    is_enable: number | string;
    /** 排序 */
    sort: number;
    /** 下级 */
    items?: Tree[];
    /** 图标 */
    icon?: string;
}

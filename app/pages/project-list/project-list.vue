<template>
    <header-container>
        <template #main-content>
            <div v-loading="loading">
                <div v-for="item in modelList" :key="item.model.key">
                    <!-- 展示model -->
                     <div class="model-panel">
                        <el-row type="flex" align="middle">
                            <div class="title">{{ item.model?.name }}</div>
                        </el-row>
                        <div class="divider"></div>
                     </div>
                     <!-- 展示project -->
                      <el-row flex class="project-list">
                        <el-card
                        v-for="projItem in item.project"
                        :key="projItem.id"
                        class="project-card"
                        >
                        <template #header>
                            <div class="title">
                                <span>{{ projItem.name }}</span>
                            </div>
                        </template>
                        <div class="content">{{ projItem.desc ?? '暂无描述' }}</div>
                        <template #footer>
                            <el-button 
                                link
                                type="primary"
                                @click="onEnter(projItem)"
                            >进入</el-button>
                        </template>
                        </el-card>
                      </el-row>
                </div>
            </div>
        </template>
    </header-container>
</template>
<script setup>
import HeaderContainer from '$widgets/header-container/header-container.vue';
import { ref ,onMounted} from 'vue';
import $curl from '$common/curl.js';

const loading = ref(false);
const modelList =ref([]);
async function getModelList() {
    loading.value = true;
    try {
        const res = await $curl({
            method: 'get',
            url: '/api/project/model_list'
        });
        modelList.value = res.data;
    } catch (error) {
        console.error('获取模型列表失败:', error);
    } finally {
        loading.value = false;
    }
}
onMounted(() => {
    getModelList();
});

// 函数的作用：打开一个新标签页，加载 /view/dashboard页面，并通过 URL 中的 hash 告诉前端路由应该渲染哪个子页面，而不会触发整页刷新。
function onEnter(projItem) {
    // 在这里处理进入项目的逻辑，例如跳转到项目详情页
    const {origin} = window.location;// 协议 + 域名 + 端口
    // #最核心的特点（非常重要）:改变 #不会导致浏览器向服务器重新请求页面
    window.open(`${origin}/view/dashboard${projItem.homePage}`);//打开新窗口   
}
</script>
<style lang="less" scoped>
.model-panel {
    margin: 20px 50px;
    min-width: 500px;
    .title {
        font-size: 16px;
        font-weight: bold;
        color: #333;
    }
    .divider {
        width: 100%;
        border-bottom: 1px solid #e8e8e8;
        margin-top: 10px;
    }
}
.project-list {
    margin: 0 50px;
    .project-card {
        width: 300px;
        margin: 10px;
        .title {
            font-size: 14px;
            font-weight: bold;
            color: #333;
        }
        .content {
            font-size: 12px;
            color: #666;
            margin-top: 10px;
        }
    }
}
</style>
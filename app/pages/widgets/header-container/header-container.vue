<template>
    <el-container class="header-container">
        <el-header class="header">
            <el-row type="flex" align="middle" class="header-row">
                <!-- title -->
                <el-row type="flex" align="middle" class="title-panel">
                    <img src="./asserts/logo.png" class="logo"/>
                    <el-row class="text">{{ title }}</el-row>
                </el-row>
                <!-- 头部菜单 -->
                <slot name="menu-content"></slot>
                <!-- 设置区域 -->
                <el-row type="flex" align="middle" justify="end" class="setting-panel">
                    <slot name="setting-content"></slot>
                    <img src="./asserts/avatar.jpg" class="avatar"/>
                    <el-dropdown @command="handleCommand">
                        <span class="user-name">
                            {{ userName }}<i class="el-icon-arrow-down el-icon--right"></i>
                        </span>
                        <template #dropdown>
                            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                        </template>
                    </el-dropdown>
                </el-row>
            </el-row>
            
        </el-header>
        <el-main class="main-container">
            <!-- 主要内容 -->
            <slot name="main-content"></slot>
        </el-main>
    </el-container>
</template>

<script setup>
import { ref } from 'vue';
defineProps({
    title: String
});
const userName = ref('admin');
const handleCommand = (command) => {
    if (command === 'logout') {
        console.log('退出登录');
    }
};
</script>
<style lang="less" scoped>
.header-container {
    height: 100%;
    min-width: 100px;
    overflow: hidden;
    .header {
        max-height: 120px;
        border-bottom: 1px solid #e8e8e8;
        .header-row {
            height: 60px;
            padding: 0 20px;
            .title-panel {
                width: 180px;
                min-width: 180px;
                .logo {
                    width: 25px;
                    height: 25px;
                    margin-right: 10px;
                    border-radius: 50%;
                }
                .text {
                    font-size: 15px;
                    font-weight: 500;
                }
            }
            
        }
        .setting-panel {
                margin-left: auto;
                min-width: 180px;
                .avatar {
                    width: 30px;
                    height: 30px;
                    margin-right: 10px;
                    border-radius: 50%;
                }
                .user-name {
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    height: 60px;
                    line-height: 60px;
                    outline: none;
                }
        }
    }
    .main-container {
        
    }
}
</style>
---
title: Xposed 开发指南 (翻译)
date: 2015-09-13 08:12:47
tags:
---

>**声明**: 原创, 翻译自rovo89的官方[Development tutorial](https://github.com/rovo89/XposedBridge/wiki/Development-tutorial)
>已全部翻译, 待修改 | 最后修改于: 2015年9月16日
>水平有限, 仅供参考.

好了...你应该是想要学习如何创建一个全新的Xposed模块吧? 阅读这篇指南(或者说是"扩展教程")来学习吧. 这篇文章包含但不限于"教程", 还包括关于这件事背后的思考. 这样子的思考 会让你认识到你创造的东西的价值, 并且理解你在干什么和为什么要这么干. 如果你觉得文章太长了, 读不下, 你可以只看最后的源代码部分`Making the project an Xposed module`. 但是你如果读完了整篇文章你会获得更好的理解. 你会省下到时候回头来读的时间, 因为你如果读完了整篇文章, 你就没必要去亲自去理解每个细节.

<!--more-->

# 一个修改系统的项目

你可以在[Github](https://github.com/rovo89/XposedExamples/tree/master/RedClock)上找到一个创建红色时钟的样例. 这个样例修改状态栏上面时钟为红色并且添加了一个笑脸. 我选择这个样例是因为这个样例足够的小, 并且很容易获得可见的效果. 另外, 这个样例使用了一些Xposed框架中的一些基本的方法.

# Xposed的工作原理

在开始你对你的系统大动干戈之前, 你应该对Xposed是如何工作的有一个最基本的概念(你可以跳过这个章节, 如果你觉得很无聊). 
首先, 系统里面有一个叫作"Zygote"的进程. 这是Android运作的核心. 每一个程序都是作为这个进程的副本("fork")来打开的. 这个进程会被一个叫作`/init.rc`的脚本在开机的时候打开. 这个进程被放在`/system/bin/app_process`中, 用于在加载系统所必须的类和调用初始化方法.
下面要介绍Xposed是从哪里闯进到你的系统里面的. 当你安装了这个框架, 一个[拓展的可执行应用进程](https://github.com/rovo89/Xposed)就被复制到了`/system/bin`当中. 这个进程通过在环境变量中加载额外的jar并从某些地方调用一些方法. 举个例子, Zygota的main方法被调用只是在VM被创建之后. 在这个方法里面, 是Zygota的用来在context执行的一部分.
这个jar被放在`/data/data/de.robv.android.xposed.installer/bin/XposedBridge.jar`中, 并且你可以在[这里](https://github.com/rovo89/XposedBridge)找到它的源代码. 打开[XposedBridge](https://github.com/rovo89/XposedBridge/blob/master/src/de/robv/android/xposed/XposedBridge.java)这个类, 看一下这个的main方法. 这个就是我写在上面的东西, 用来在手机刚启动非常早的时候被调用. 一些初始化方法会被执行, 还有一些模块会被加载(这个会在模块加载部分再说).

## hook和取代一个方法

那到底是什么东西让Xposed有如此强大的能力去"hook"调用一个方法. 当你通过反编译修改一个APK, 你可以直接插入或者修改你想要的指令. 然而, 你还要重新编译并签署这个APK, 并且还需要发布整个完整地APK. 通过Hook, 你可通过Xposed实现这个功能, 你不能修改一个应用内部的方法(因为几乎不可能去确定你到底需要什么样子的修改和放在什么位置). 但是你可以在一个方法前面或者后面注入你的代码, 这是最小的可以明确位置的Java单元.
XposedBridge拥有一个叫作`hookMethodNative`的私有原生方法. 这个方法被拓展的app_process实现. 会修改这个方法为"原生"并与这个方法的实现与系统原生的平常方法相连接. 这就意味着, 每一次这个被hook的方法将被调用, 这个平常的方法就会被取而代之地调用, 同时调用者并不知情. 在这个方法当中, `handleHookedMethod`会被调用, 并且将传输参数到这个方法,引用等当中. 而且这个方法会检测到已经在这个方法里面注册过的唤醒回调信号. 这样一来, 我们就可以修改当前方法调用的参数, 修改实例化的或者静态的变量, 唤醒其他方法, 根据返回的结果去干一些事情...当然也可跳过任何东西. 一切都显得非常灵活.
好了, 原理就讲到这儿. 现在让我们开始创建一个模块吧.

# 创建一个项目

一个模块就是一个普通的app, 只是有一些特殊的meta信息和文件. 所以, 先创建一个全新的Android项目. 我现在假设你已经在这之前做好了这件事. 如果没有, 在[官方文档](http://developer.android.com/sdk/installing.html)里面已经很细致地教你怎么做了. 至于SDK的问题, 我选择了4.0.3(API 15). 我建议你尝试也这么去做, 并且暂时不要轻易去尝试其他版本. 你不需要创建一个Activity, 因为修改系统不需要任何UI界面. 在我回答玩这个问题之后, 我想你应该已经有了一个空白的项目了吧.

# 把这个项目Xposed化

现在, 我们将这个项目转化成一个会被Xposed加载的模块吧. 会有一些必要的步骤.

## AndroidManifest.xml

在Xposed Installer里面的模块列表会根据应用中是否包含特殊的meta信息标志来判断是否是Xposed模块. 你可以根据`AndroidManifest.xml => Application => Application Nodes (at the bottom) => Add => Meta Data`来实现. 标签的名字应该是`xposedmodule`并且相应的值应该是`true`. 然后保证这个项目其他资源是空的. 然后在`xposedminversion`和`xposeddescription`(关于你的模块的一个非常短小的描述)中重复同样的事情. XML文件应该看起来像这样:
```XML
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="de.robv.android.xposed.mods.tutorial"
    android:versionCode="1"
    android:versionName="1.0" >

    <uses-sdk android:minSdkVersion="15" />

    <application
        android:icon="@drawable/ic_launcher"
        android:label="@string/app_name" >
        <meta-data
            android:name="xposedmodule"
            android:value="true" />
        <meta-data
            android:name="xposeddescription"
            android:value="Easy example which makes the status bar clock red and adds a smiley" />
        <meta-data
            android:name="xposedminversion"
            android:value="30" />
    </application>
</manifest>
```

## XposedBridgeApi.jar

接下来, 你要让这个项目能够调用XposedBridge的API. 你可以从[XDA帖子](http://forum.xda-developers.com/xposed/xposed-api-changelog-t2714067)的一楼下载`XposedBridgeApi-<version>.jar`. 将这个jar复制到项目一个叫作`lib`的子目录, 然后右键这个文件并选择Build Path => Add to Build Path(Android Studio可以看我的[文章](http://sorcererxw.com/post/gong-ju/android-studiodao-ru-jarde-fang-fa)). 文件名当中的`<version>`就是你要作为`xposedminversion`插入manifest中的值.
>确保这个API类没有被包含在你编译出来的APK文件当中(仅仅去引用这个API). 否则, 你会遇到`IllegalAccessError`. 放在`libs`(注意是加\`s\`的)文件夹下面的文件会被Eclipse自动包含到APK当中, 所以不要将API文件放在这里面.

## Module implementation

现在你可以为你的模块创建一个class. 我现在演示的class的名字叫作"Tutorial"并且包名是`de.robv.android.xposed.mods.tutorial`:
```Java
package de.robv.android.xposed.mods.tutorial;

public class Tutorial {

}
```
第一步, 我们会执行一些Log输出去证明模块已经被加载了. 一个模块有多个入口, 至于要选择哪一个取决与你要修改什么东西. 你可以在任何时候让Xposed在你的模块中执行一些函数, 包括系统启动的时候, 一个新的app被加载的时候, 一个app的资源文件被初始化的时候等.
在这篇教程的后面, 你认识到一个特定的app需要一些必要的修改, 看看"let me know when a new app is loaded"中的入口. 所有入口都被IXposedMod的子接口标记. 在这个案例中, 你需要implement IXposedHookLoadPackage. 事实上这就是一个有一个参数的方法, 用于提供更多关于context信息给模块. 在我们的样例当中, 让我们Log输出那个正在加载的app的名字:
```Java
package de.robv.android.xposed.mods.tutorial;

import de.robv.android.xposed.IXposedHookLoadPackage;
import de.robv.android.xposed.XposedBridge;
import de.robv.android.xposed.callbacks.XC_LoadPackage.LoadPackageParam;

public class Tutorial implements IXposedHookLoadPackage {
    public void handleLoadPackage(final LoadPackageParam lpparam) throws Throwable {
        XposedBridge.log("Loaded app: " + lpparam.packageName);
    }
}
```
这个Log方法输出信息到stardard logcat(tag是`Xposed`)和/data/data/de.robv.android.xposed.installer/log/debug.log(一个可以通过Xposed Installer轻易访问的位置)当中.

## assets/xposed_init

到此为止, 现在唯一还缺少的东西就是一个为XposedBridge准备的指示. 这件事可以通过一个叫`xposed_init`的文件来实现. 在`assets`文件夹下面创建一个新的名叫`xposed_init`的文本文件. 在这个文件中, 每一行都包含一个完全授权的类名. 在这个案例当中, 这个就是`de.robv.android.xposed.mods.tutorial.Tutorial`.

# 试着运行一下

保存你的文件. 然后编译并运行的你的Android应用. 这就是你第一次安装这个应用, 在使用之前, 你需要授权这个应用. 打开Xposed Installer的应用, 确保你已经安装了Xposed的框架. 然后切换到"Modules"页面. 你应该可以找到你的应用已经出现在这儿了. 勾选复选框来授权. 然后重启你的手机. 你不会在手机进程中看到什么不同, 但是当你观察控制台输出的Log信息, 你可以看到像这样的一些东西:
>Loading Xposed (for Zygote)...
>Loading modules from /data/app/de.robv.android.xposed.mods.tutorial-1.apk
> Loading class de.robv.android.xposed.mods.tutorial.Tutorial
>Loaded app: com.android.systemui
>Loaded app: com.android.settings
>... (many more apps follow)

恭喜你! 这个应用已经成功运行了. 你现在拥有了一个Xposed的模块. 这个可以变得更加有用, 而不只是输出Log信息...

# 寻找你的目标并修改它

好了, 所以现在开始的部分会完全取决于你想要做什么, 同时也会各种各样. 如果你曾经修改过一个APK, 你大概知道现在要如何去思考. 总体来说, 你首先需要获取一些你的目标实现对象的内部细节. 在这个教程当中, 目标就是状态栏当中的时钟. 这个样例会帮助你去了解状态栏和其他SystemUI部分. 所以, 我们要开始一些搜索.
可能的一种方法: 反编译一下. 这会让你获得implementation的具体信息, 但是这会很难去阅读并理解, 因为你将会获得smali格式的代码.
可能的另一种方法: 获取AOSP源码([这儿](http://source.android.com/source/downloading.html)或者[这儿](http://grepcode.com/snapshot/repository.grepcode.com/java/ext/com.google.android/android/4.0.3_r1/)), 这些会和你的ROM有很大的区别, 但是在这里面有相似甚至几乎相同的implementation. 我一般会先看AOSP来确定是否已经足够了. 如果我需要更多的细节, 我会去看实际反编译出来的代码.
你可以看看那个名字是或者当中包含"clock"的类. 其他东西是资源和布局文件. 如果你下载了官方的AOSP源代码, 你可以开始在frameworks/base/packages/SystemUI中找. 你会找到一些地方其中出现了"clock". 这是普通并且确实是一个不寻常的方法去实现一个修改. 记住你现在"只能"去hook一个方法. 所以你需要找到一个合适的地方去插入一些代码以实现这一个神奇的过程. 这个地方可以是一个方法的前面和后面, 或者直接取代这个方法. 你要hook的方法越明确越好, 最好不是那些会被调用成千上百次的方法, 以避免对手机性能造成影响, 以及一些不可预期的负面影响.
在这个样例当中, 你可能发现res/layout/status_bar.xml包含了对com.android.systemui.statusbar.policy.Clock. Multiple中的自定义View的引用. 这个文字颜色是被通过一个textAppearance attribute被定义的, 所以修改颜色最轻便的方法就好似去修改这个apperance的定义. 然而, 并不能通过Xposed框架去修改系统style, 而且也不一定生效(这个在原生代码里面太深了). 替换整个状态栏layout文件似乎更有可能成功, 但是这样子可能会过度造成一些小变化. 相反地, 看看这个类吧. 有一个叫作updateClock的方法, 似乎是用来每过一分钟更新一次时间的:
```Java
final void updateClock() {
    mCalendar.setTimeInMillis(System.currentTimeMillis());
    setText(getSmallTime());
}
```
这个看上去简直就是完美的修改, 因为这个是非常明确的方法, 看上去只是用来修改时钟上文字的方法, 如我们在这个方法每一次被调用之后加一点东西就可以达到修改时钟文字和色彩的目的. 所以, 我们来试试:
>对于仅仅修改文字颜色, 这个明显是一个更好的方法. 也可以在([替换资源文件](https://github.com/rovo89/XposedBridge/wiki/Replacing-resources))看看一下"修改layout"

# 使用应用来寻找并hook方法

想象现在我们已经知道了什么? 我们在com.android.systemui.statusbar.policy.Clock中有了一个updateClock的方法并且我们准备去拦截这个方法. 我们在SystemUI资源中找到了这个类, 所以这个应该在SystemUI的进程当中起到一定的作用. 如果我们尝试从中去获取一些信息并在handleLoadPackage方法中直接应用这个类, 这样子没准会失败, 因为这个没准就是一个错误的进程. 所以, 当特定的包被加载, 我们先implement去执行一些代码.
```Java
public void handleLoadPackage(LoadPackageParam lpparam) throws Throwable {
    if (!lpparam.packageName.equals("com.android.systemui"))
        return;

    XposedBridge.log("we are in SystemUI!");
}
```
通过使用parameter, 我们可以轻易确认我是否在正确的包内. 一旦确认, 我们会尝试去接触包内一个叫作`ClassLoader`的类, 这个类是也是被这个变量引用的. 现在, 我们可以寻找com.android.systemui.statusbar.policy.Clock类以及其中的upclockClock方法, 告诉XposedBridge去hook:
```Java
package de.robv.android.xposed.mods.tutorial;

import static de.robv.android.xposed.XposedHelpers.findAndHookMethod;
import de.robv.android.xposed.IXposedHookLoadPackage;
import de.robv.android.xposed.XC_MethodHook;
import de.robv.android.xposed.callbacks.XC_LoadPackage.LoadPackageParam;

public class Tutorial implements IXposedHookLoadPackage {
    public void handleLoadPackage(final LoadPackageParam lpparam) throws Throwable {
        if (!lpparam.packageName.equals("com.android.systemui"))
            return;

        findAndHookMethod("com.android.systemui.statusbar.policy.Clock", lpparam.classLoader, "updateClock", new XC_MethodHook() {
            @Override
            protected void beforeHookedMethod(MethodHookParam param) throws Throwable {
                // this will be called before the clock was updated by the original method
            }
            @Override
            protected void afterHookedMethod(MethodHookParam param) throws Throwable {
                // this will be called after the clock was updated by the original method
            }
    });
    }
}
```
findAndHookMethod是一个[helper](https://github.com/rovo89/XposedBridge/wiki/Helpers)的函数. 记录静态的输入, 会自动添加如果你确认这个就是描述中的那个页面. 这个方法通过SystemUI中的ClassLoader查找Clock类. 然后在其中寻找updateClock方法. 如果有任何parameter指向这个方法, 之后你需要列出所有parameter的种类. 有多种方法去做这件事情, 但是我们的方法并不包含任何parameter, 让我们先跳过这个. 至于最后那个参数, 你需要去为implement XC_MethodHook类做准备.  为了让修改精简, 你可以使用匿名内部类. 如果你写了很多的代码, 最好去创建一个普通的类并将实例都写在这儿. 然后helper会帮助你做一切上面描述的用于hook的必要事情.
在XC_MethodHook方法当中, 有两个方法提供你去改写. 你可以选择都改写或者都不. 但是如果你都不改写, 等会儿将绝对看不到任何效果. 这些方法是`beforeHookedMethod`和`afterHookedMethod`. 不难猜测, 这两个分别会在原生方法前后执行. 你可以用"before"方法去评估或者篡改传给原生方法的参数(通过param.args), 甚至阻止对原生方法的调用(传输你的方法的结果). "after"方法可以用于干一些基于原生方法输出结果的事情. 你也可以在此时篡改结果. 当然, 你可以在原生方法调用前后添加你自己的代码.
>如果你想要完全取代原生方法, 可以看看`XC_MethodReplacement`这个子方法. 你只需要去重写这个方法.

XposedBridge当中有一个列表, 用于记录每一个hook方法的注册回调方法. 那些都方法都有着最高的优先级(定义在hookMethod中), 会被优先调用. 这个原生方法总是最低的优先级. 所以, 如果你通过回调A(高优先级)和B(默认优先级)hook了一个方法, 那么无论何时被hook的方法被调用, 总是遵循这个流程: A.before -> B.before -> 原生方法 -> B.after -> A.after. 所以, A可以影响传到B的参数, 会更深一层修改这个参数在它们结束之前. 原生方法输出的结果会先被B处理, 但是A对于最终的结果会有最终话语权.

# 最后一步: 在方法调用前后执行你的代码

好了, 现在你的这个方法根据会在每一次updateClock方法被调用的时候同时被调用了. 现在让我们来修改一些东西.
首先确认一下: 我确实已经引用了Clock对象? 是的, 已经存在于param.thisObject parameter中了. 所以, 如果这个方法被`myClock.ipdateClock()`调用, `param.thisObject`就是`myClock`.
接下去: 我们能对那个时钟干些什么? 这个Clock类现在并不能正常运行, 你不能直接将param.thisObject丢进去. 但是, 这个继承了TextView. 一旦你让这个Clock应用TextView, 你就可以使用setText, getText和setTextColor方法. 这个修改会被执行于原生设置新时间的方法后面. 在beforeHookedMethod(原生方法之前)中我们没什么事情可以做, 但是我们并不用去调用super方法.
来完成我们的代码:
```Java
package de.robv.android.xposed.mods.tutorial;

import static de.robv.android.xposed.XposedHelpers.findAndHookMethod;
import android.graphics.Color;
import android.widget.TextView;
import de.robv.android.xposed.IXposedHookLoadPackage;
import de.robv.android.xposed.XC_MethodHook;
import de.robv.android.xposed.callbacks.XC_LoadPackage.LoadPackageParam;

public class Tutorial implements IXposedHookLoadPackage {
    public void handleLoadPackage(final LoadPackageParam lpparam) throws Throwable {
        if (!lpparam.packageName.equals("com.android.systemui"))
            return;

        findAndHookMethod("com.android.systemui.statusbar.policy.Clock", lpparam.classLoader, "updateClock", new XC_MethodHook() {
            @Override
            protected void afterHookedMethod(MethodHookParam param) throws Throwable {
                TextView tv = (TextView) param.thisObject;
                String text = tv.getText().toString();
                tv.setText(text + " :)");
                tv.setTextColor(Color.RED);
            }
        });
    }
}
```

# 笑看最后的结果

现在再一次安装并启动的你的应用. 因为第一次安装时候, 你已经在Xposed Installer当中授权了这个应用, 你不需要再一次进行授权, 重启就够了. 然而, 你可能想要停止使用红色时钟, 只需要去取消授权即可. 如果原生和你修改模块都使用了默认的优先级, 那你也说不清哪个优先级更高(这个取决于handler方法的字符串代表, 并不依赖于模块).

# 总结

我也知道这个教程挺长的. 但是我希望你不只是实现一个绿色的时钟, 而是更多完全不一样的东西.如何找到好的方法去hook取决于你的经验, 所以要从简单的事情开始. 在一开始请尝试用Log在控制台输出, 以保证每一个地方都如你预期被调用. 另外, 衷心地祝福你在其中获得快乐.
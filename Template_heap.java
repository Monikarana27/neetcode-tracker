import java.util.*;

public class Template_heap {
static int kth(int[] a,int k) {
    if(k<1 || k>a.length) throw new IllegalArgumentException();
    PriorityQueue<Integer> heap=new PriorityQueue<>();
    for(int x:a) { heap.offer(x); if(heap.size()>k) heap.poll(); }
    return heap.peek();
}
}
